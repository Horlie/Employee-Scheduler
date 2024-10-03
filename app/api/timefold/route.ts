import { NextResponse } from "next/server";
import { PrismaClient, User } from "@prisma/client";
import { Employee, EmployeeAvailability, Shift, RoleSettings } from "@/app/types/scheduler";

const prisma = new PrismaClient();

export async function GET() {
  const employeeId = 1;

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
    const timefoldJson = buildTimefoldJson(employees, shifts, user!);
    return NextResponse.json(timefoldJson);
  } catch (error) {
    console.error("Error generating TimeFold JSON:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function buildTimefoldJson(employees: Employee[], shifts: Shift[], user: User) {
  const timefoldEmployees = employees.map((employee: Employee) => ({
    name: employee.name,
    skills: [employee.role], // Assuming 'role' is a string
    unavailableIntervals: employee.availability
      ? employee.availability
          .filter((a: EmployeeAvailability) => a.status === "unreachable")
          .map((a: EmployeeAvailability) => ({
            start: a.startDate,
            end: a.finishDate,
          }))
      : [],
    undesiredIntervals: employee.availability
      ? employee.availability
          .filter((a: EmployeeAvailability) => a.status === "unavailable")
          .map((a: EmployeeAvailability) => ({
            start: a.startDate,
            end: a.finishDate,
          }))
      : [],
    desiredIntervals: employee.availability
      ? employee.availability
          .filter((a: EmployeeAvailability) => a.status === "preferable")
          .map((a: EmployeeAvailability) => ({
            start: a.startDate,
            end: a.finishDate,
          }))
      : [],
    monthlyHours: user.monthlyHours ? Math.floor(user.monthlyHours * employee.rate) : 160, // 160 for standard
  }));

  const timefoldShifts = generateMonthlyShifts(
    user.roleSettings as unknown as RoleSettings,
    shifts,
    user.dailyShiftsPerWorkerPerMonth ? user.dailyShiftsPerWorkerPerMonth : 1
  );

  return {
    employees: timefoldEmployees,
    shifts: timefoldShifts,
  };
}

function generateMonthlyShifts(
  roleSettings: RoleSettings,
  shifts: Shift[],
  dailyShiftsPerWorkerPerMonth: number
) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const timefoldShifts: Array<{
    id: number;
    start: string;
    end: string;
    location: string;
    requiredSkill: string;
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
                start: startTime.toISOString().slice(0, -2),
                end: endTime.toISOString().slice(0, -2),
                location: "Hospital",
                requiredSkill: role,
              });
            }
          }
        });
      } else if (shift.days.includes(dayName) && shift.isFullDay) {
        shift.role.forEach((role) => {
          for (let i = 0; i < dailyShiftsPerWorkerPerMonth; i++) {
            const { startTime, endTime } = getShiftTimes(shift, date);
            timefoldShifts.push({
              id: timefoldShifts.length + 1,
              start: startTime.toISOString().slice(0, -2),
              end: endTime.toISOString().slice(0, -2),
              location: "Hospital",
              requiredSkill: role,
            });
          }
        });
      }
    });
  }

  return timefoldShifts;
}

function getShiftTimes(shift: Shift, date: Date): { startTime: Date; endTime: Date } {
  const { startTime, endTime } = parseShiftTimes(shift.startTime, shift.endTime, date);

  return { startTime: startTime, endTime: endTime };
}

function parseShiftTimes(
  startTimeStr: string,
  endTimeStr: string,
  date: Date
): { startTime: Date; endTime: Date } {
  const [startHour, startMinute, startSecond] = startTimeStr.split(":").map(Number);
  const [endHour, endMinute, endSecond] = endTimeStr.split(":").map(Number);
  let currentDate = new Date(date);
  const startTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    startHour,
    startMinute,
    startSecond
  );
  const endTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    endHour,
    endMinute,
    endSecond
  );

  // If end time is earlier than start time, assume it goes to the next day
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return { startTime: localToUTC(startTime), endTime: localToUTC(endTime) };
}

const localToUTC = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};
