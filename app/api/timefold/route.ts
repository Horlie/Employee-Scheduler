import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import {
  Employee,
  EmployeeAvailability,
  Shift,
  RoleSettings,
  DailyShiftSettings,
  User,
} from "@/app/types/scheduler";
import { JsonValue } from "@prisma/client/runtime/library";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(req: Request) {
  try {
    await prisma.$connect();

    const { employeeId, month } = await req.json();

    try {
      // Fetch employees with their availabilities and roles
      // Fetch all employees with their user information
      const employees = await prisma.employee.findMany({
        where: {
          user: {
            id: employeeId,
          },
        },
        include: {
          availability: true, // Include availability for each employee
        },
      });

      // Fetch user settings (assuming a single user for simplicity)

      const user = await prisma.user.findUnique({
        where: {
          id: employeeId,
        },
      });

      // Fetch all shifts
      const shifts = await prisma.shift.findMany({
        where: {
          user: {
            id: employeeId,
          },
        },
      });
      // Build the TimeFold JSON
      const timefoldJson = buildTimefoldJson(employees, shifts, user as User, month);

      // Send POST request to BACKEND_URL/schedules
      const postResponse = await fetch(`${BACKEND_URL}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(timefoldJson),
      });

      // Add logging for POST response
      const postText = await postResponse.text();
      console.log("POST /schedules response:", postText);

      // Send GET request to BACKEND_URL/scheduler/{jobId}
      const getResponse = await fetch(`${BACKEND_URL}/schedules/${postText}`);
      const getText = await getResponse.text();
      console.log(`GET /schedules/${postText} response:`, getText);

      let statusData: any;
      try {
        statusData = JSON.parse(getText);
      } catch (parseError) {
        console.error("Error parsing GET response JSON:", parseError);
        return NextResponse.json(
          { error: "Invalid status response from scheduler service." },
          { status: 500 }
        );
      }

      // If solverStatus is NOT_SOLVING, return the status JSON
      while (statusData.solverStatus !== "NOT_SOLVING") {
        console.log("Waiting for solver to finish...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const getResponse = await fetch(`${BACKEND_URL}/schedules/${postText}`);
        const getText = await getResponse.text();
        statusData = JSON.parse(getText);
      }
      return NextResponse.json(statusData);
    } catch (error) {
      console.error("Error generating TimeFold JSON:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error generating TimeFold JSON:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await prisma.$connect();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
    }

    try {
      const schedule = await prisma.schedule.findMany({
        where: {
          userId: parseInt(userId),
        },
      });

      if (!schedule) {
        return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
      }

      return NextResponse.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function buildTimefoldJson(employees: Employee[], shifts: Shift[], user: User, month: number) {
  const timefoldEmployees = employees.map((employee: Employee) => ({
    name: employee.name,
    skills: [employee.role],
    unavailableIntervals: employee.availability
      ? employee.availability
          .filter((a: EmployeeAvailability) => a.status === "unreachable")
          .map((a: EmployeeAvailability) => ({
            start: formatInTimeZone(new Date(a.startDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
            end: formatInTimeZone(new Date(a.finishDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
          }))
      : [],
    undesiredIntervals: employee.availability
      ? employee.availability
          .filter((a: EmployeeAvailability) => a.status === "unavailable")
          .map((a: EmployeeAvailability) => ({
            start: formatInTimeZone(new Date(a.startDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
            end: formatInTimeZone(new Date(a.finishDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
          }))
      : [],
    desiredIntervals: employee.availability
      ? employee.availability
          .filter((a: EmployeeAvailability) => a.status === "preferable")
          .map((a: EmployeeAvailability) => ({
            start: formatInTimeZone(new Date(a.startDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
            end: formatInTimeZone(new Date(a.finishDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
          }))
      : [],
    monthlyHours: user.monthlyHours ? Math.floor(user.monthlyHours * employee.rate) : 160,
  }));

  const timefoldShifts = generateMonthlyShifts(
    user.roleSettings as unknown as RoleSettings,
    shifts,
    user.dailyShiftSettings
      ? (user.dailyShiftSettings as unknown as JsonValue)
      : { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
    month
  );

  return {
    employees: timefoldEmployees,
    shifts: timefoldShifts,
  };
}

function generateMonthlyShifts(
  roleSettings: RoleSettings,
  shifts: Shift[],
  dailyShiftSettings: JsonValue,
  month: number
) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const timefoldShifts: Array<{
    id: number;
    start: string;
    end: string;
    location: string;
    requiredSkill: string;
    isFullDay: boolean;
  }> = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      dayOfWeek
    ];
    shifts.forEach((shift) => {
      if (shift.days.includes(dayName) && !shift.isFullDay) {
        shift.role.forEach((role) => {
          const shiftCount =
            roleSettings[role as keyof RoleSettings]?.[
              dayName as keyof RoleSettings[keyof RoleSettings]
            ] ?? 0;
          if (typeof shiftCount === "number") {
            for (let i = 0; i < shiftCount; i++) {
              const { startTime, endTime } = getShiftTimes(shift, date);
              timefoldShifts.push({
                id: timefoldShifts.length + 1,
                start: formatInTimeZone(startTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                end: formatInTimeZone(endTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                location: "Hospital",
                requiredSkill: role,
                isFullDay: shift.isFullDay,
              });
            }
          }
        });
      } else if (shift.days.includes(dayName) && shift.isFullDay) {
        shift.role.forEach((role) => {
          const shiftCount = dailyShiftSettings
            ? (dailyShiftSettings as DailyShiftSettings)[dayName as keyof DailyShiftSettings]
            : 0;
          if (typeof shiftCount === "number") {
            for (let i = 0; i < shiftCount; i++) {
              const { startTime, endTime } = getShiftTimes(shift, date);
              timefoldShifts.push({
                id: timefoldShifts.length + 1,
                start: formatInTimeZone(startTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                end: formatInTimeZone(endTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                location: "Hospital",
                requiredSkill: role,
                isFullDay: shift.isFullDay,
              });
            }
          }
        });
      }
    });
  }

  return timefoldShifts;
}

function getShiftTimes(shift: Shift, date: Date): { startTime: Date; endTime: Date } {
  const { startTime, endTime } = parseShiftTimes(shift.startTime, shift.endTime, date);
  return { startTime, endTime };
}

function parseShiftTimes(
  startTimeStr: string,
  endTimeStr: string,
  date: Date
): { startTime: Date; endTime: Date } {
  const [startHour, startMinute, startSecond] = startTimeStr.split(":").map(Number);
  const [endHour, endMinute, endSecond] = endTimeStr.split(":").map(Number);

  const startTime = fromZonedTime(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startHour,
      startMinute,
      startSecond
    ),
    "UTC"
  );

  let endTime = fromZonedTime(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute, endSecond),
    "UTC"
  );

  // If end time is earlier than start time, assume it goes to the next day
  if (endTime <= startTime) {
    endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
  }

  return { startTime, endTime };
}
