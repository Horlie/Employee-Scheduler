import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { Employee, EmployeeAvailability, Shift, RoleSettings, User } from "@/app/types/scheduler";

const BACKEND_URL = process.env.BACKEND_URL;
export const maxDuration = 60;
export const dynamic = "force-dynamic";

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

      // Get all roles from user settings
      const roles = Object.keys(user?.roleSettings || {});

      const rolePromises = roles.map(async (role) => {
        // Filter employees by role
        const roleEmployees = employees.filter((employee: Employee) => employee.role === role);

        // Build TimeFold JSON for the role
        const roleTimefoldJson = buildTimefoldJson(
          roleEmployees,
          shifts,
          user as User,
          month,
          role, 
          employees
          
        );

        // Send POST request to BACKEND_URL/schedules for the role
        const postResponse = await fetch(`${BACKEND_URL}/schedules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(roleTimefoldJson),
        });

        // Add logging for POST response
        const postText = await postResponse.text();
        console.log(`POST /schedules response for role ${role}:`, postText);

        // Send GET request to BACKEND_URL/scheduler/{jobId} for the role
        const getResponse = await fetch(`${BACKEND_URL}/schedules/${postText}`);
        const getText = await getResponse.text();
        console.log(`GET /schedules/${postText} response for role ${role}:`, getText);

        let statusData: any;
        try {
          statusData = JSON.parse(getText);
        } catch (parseError) {
          console.error(`Error parsing GET response JSON for role ${role}:`, parseError);
          return { [role]: { error: "Invalid status response from scheduler service." } };
        }

        // If solverStatus is NOT_SOLVING, continue checking
        while (statusData.solverStatus !== "NOT_SOLVING") {
          console.log("Waiting for solver to finish...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const retryResponse = await fetch(`${BACKEND_URL}/schedules/${postText}`);
          const retryText = await retryResponse.text();
          statusData = JSON.parse(retryText);
        }

        return { [role]: statusData };
      });

      const roleResponsesArray = await Promise.all(rolePromises);
      const roleResponses = roleResponsesArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});

      return NextResponse.json(roleResponses);
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

function buildTimefoldJson(
  roleEmployees: Employee[],
  shifts: Shift[],
  user: User,
  month: number,
  role: string, 
  allEmployees: Employee[]
) {
  const timefoldEmployees = roleEmployees
    .filter(
      (employee) => employee.role === role && Math.floor(user.monthlyHours * employee.rate) > 0
    ) // Filter employees by role
    .map((employee: Employee) => ({
      name: employee.name,
      skills: [employee.role],
      vacationIntervals: employee.availability
        ? employee.availability
            .filter((a: EmployeeAvailability) => a.status === "vacation")
            .map((a: EmployeeAvailability) => ({
              start: formatInTimeZone(new Date(a.startDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
              end: formatInTimeZone(new Date(a.finishDate), "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
            }))
        : [],
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
    month,
    role, 
    allEmployees 
  );

  return {
    employees: timefoldEmployees,
    shifts: timefoldShifts,
  };
}

function generateMonthlyShifts(
  roleSettings: RoleSettings,
  shifts: Shift[],
  month: number,
  role: string, 
  allEmployees: Employee[]
) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const timefoldShifts: Array<{
    id: string; 
    start: string;
    end: string;
    location: string;
    requiredSkill: string;
    isFullDay: boolean;
    coverageGroupId?: string;
    coveragePart?: number;
    midTime?: string;
  }> = [];
  let shiftCounter = 1; 

  const employeesInRole = allEmployees.filter(emp => emp.role === role);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      dayOfWeek
    ];
    const availableEmployeesCount = employeesInRole.filter(emp => {
      
      const isUnavailable = emp.availability?.some(avail => {
        const availDate = new Date(avail.startDate).toDateString();
        return availDate === date.toDateString() && (avail.status === 'unreachable' || avail.status === 'vacation');
      });
      return !isUnavailable; 
    }).length;

    shifts.forEach((shift) => {
      if (shift.days.includes(dayName) && shift.role.includes(role)) {
        // Filter shifts by role
        shift.role.forEach((shiftRole) => {
          if (shiftRole !== role) return; // Only process the current role

          const shiftString = shift.isFullDay
            ? `FullDay (${shift.startTime.slice(0, -3)} - ${shift.endTime.slice(0, -3)})`
            : `${shift.startTime.slice(0, -3)}-${shift.endTime.slice(0, -3)}`;

          const shiftCount =
            roleSettings[role]?.[shiftString]?.[
              dayName as keyof (typeof roleSettings)[typeof role][typeof shiftString]
            ] || 0;

          for (let i = 0; i < shiftCount; i++) {
            const { startTime, endTime } = getShiftTimes(shift, date);
            const shouldSplitShift = shift.isFullDay && availableEmployeesCount > shiftCount * 2;

           if (shouldSplitShift) {
              console.log(`Splitting Full Day shift on ${date.toLocaleDateString()} for role '${role}'. Available employees: ${availableEmployeesCount}`);
              
              const midTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000);

              timefoldShifts.push({
                id: `${role}_${shiftCounter++}`,
                start: formatInTimeZone(startTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                end: formatInTimeZone(midTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                location: "Hospital",
                requiredSkill: role,
                isFullDay: false,
                midTime: formatInTimeZone(midTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"), 
              });

              timefoldShifts.push({
                id: `${role}_${shiftCounter++}`,
                start: formatInTimeZone(midTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                end: formatInTimeZone(endTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                location: "Hospital",
                requiredSkill: role,
                isFullDay: false,
              });
            } else {
              if (shift.isFullDay) {
                 console.log(`Keeping Full Day shift as single on ${date.toLocaleDateString()} for role '${role}'. Available employees: ${availableEmployeesCount}`);
              }

              timefoldShifts.push({
                id: `${role}_${shiftCounter++}`,
                start: formatInTimeZone(startTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                end: formatInTimeZone(endTime, "UTC", "yyyy-MM-dd'T'HH:mm:ss"),
                location: "Hospital",
                requiredSkill: role,
                isFullDay: shift.isFullDay,
              });
            }
            
        }});
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
