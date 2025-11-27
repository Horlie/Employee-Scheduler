import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Gender } from "@/app/types/scheduler";

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
      const employeesFromDb = await prisma.employee.findMany({
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
      const employees: (Employee & {  gender: Gender })[] = employeesFromDb.map(emp => ({
        ...emp,
        gender: emp.gender as Gender,
      }));

      const rolePromises = roles.map(async (role) => {
        // Filter employees by role - check if employee's roles array includes this role
        const roleEmployees = employees.filter((employee: Employee) => employee.roles.includes(role));

        // Build TimeFold JSON for the role
        const roleTimefoldJson = buildTimefoldJson(
          roleEmployees as Employee[],
          shifts,
          user as User,
          month,
          role, 
          employees as Employee[]
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


function buildTimefoldJson(
  roleEmployees: Employee[],
  shifts: any[],
  user: User,
  month: number,
  role: string, 
  allEmployees: Employee[]
) {

  let map = new Map<Employee, number>;
  roleEmployees.forEach(
    (employee) => {
    const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
    const vacationDays = employee.availability?.filter(avail =>
      avail.status === 'vacation' &&
      new Date(avail.startDate).getMonth() === month
    ).length ?? 0;

    let adjustedRate = employee.rate;
    if (vacationDays > 0) {
      adjustedRate = (daysInMonth - vacationDays) / daysInMonth * employee.rate;
    }
    map.set(employee, adjustedRate);
    });
  

  const timefoldEmployees = roleEmployees
    .filter(
      (employee) => employee.roles.includes(role) && Math.floor(user.monthlyHours * employee.rate) > 0
    ) // Filter employees by role
    .map((employee: Employee) => ({ 
      id: employee.id,
      name: employee.name,
      skills: [...employee.roles, employee.gender], // Include both roles and gender as skills
      vacationIntervals: employee.availability
        ? employee.availability
            .filter((a: EmployeeAvailability) => a.status === "vacation")
            .map((a: EmployeeAvailability) => ({
              start: a.startDate,
              end: a.finishDate,
            }))
        : [],
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
      monthlyHours: user.monthlyHours ? Math.floor(user.monthlyHours * (map.get(employee)  ?? employee.rate)) : 160,
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
    gender: string[];
    isFullDay: boolean;
    midTime?: string;
  }> = [];
  let shiftCounter = 1; 

  const employeesInRole = allEmployees.filter(emp => emp.roles.includes(role));

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      dayOfWeek
    ];
    
    shifts.forEach((shift) => {
      if (shift.days.includes(dayName) && shift.roles.includes(role)) {
        // Calculate available employees count (gender filtering is now handled by Timefold via skills)
        const availableEmployeesCount = employeesInRole.filter(emp => {
          const isUnavailable = emp.availability?.some(avail => {
            const start = new Date(avail.startDate);
            const finish = new Date(avail.finishDate); 
            const status = (avail.status ?? "").toLowerCase();

            const isUnavailableStatus = status === "unavailable" || status === "vacation";
            const isWithinRange = date >= start && date <= finish;

            return isWithinRange && isUnavailableStatus;
          });
          
          return !isUnavailable;
        }).length;

        // Filter shifts by role
        shift.roles.forEach((shiftRole) => {
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
            const splitThresholdString = shift.numberToSplitAt; 
            const splitHourString = shift.hourToSplitAt;
            const splitThreshold = splitThresholdString ? parseInt(splitThresholdString, 10) : null;
            const shouldSplitShift = shift.isFullDay && 
                                     splitThreshold != null && !isNaN(splitThreshold) &&
                                     availableEmployeesCount >= splitThreshold;

           if (shouldSplitShift && splitHourString) {
              const splitHour = parseInt(splitHourString.split(':')[0], 10);

              const midTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), splitHour, 0, 0);
              const requiredGenders = [];
              if (shift.gender) {
                const shiftGenders: string[] = typeof shift.gender === 'string' && shift.gender.includes(',')
                  ? shift.gender.split(',').map((g: string) => g.trim()).filter(g => g)
                  : Array.isArray(shift.gender)
                  ? shift.gender.filter(g => g)
                  : [shift.gender].filter(g => g);
                requiredGenders.push(...shiftGenders);
              }

              timefoldShifts.push({
                id: `${role}_${shiftCounter++}`,
                start: startTime.toISOString(), 
                end: midTime.toISOString(),
                location: "Hospital",
                requiredSkill: role,
                gender: requiredGenders,
                isFullDay: false,
                midTime: midTime.toISOString(), 
              });

              timefoldShifts.push({
                id: `${role}_${shiftCounter++}`,
                start: midTime.toISOString(),
                end: endTime.toISOString(), 
                location: "Hospital",
                requiredSkill: role,
                gender: requiredGenders,
                isFullDay: false,
              });
            } else {
              if (shift.isFullDay) {
                 console.log(`Keeping Full Day shift as single on ${date.toLocaleDateString()} for role '${role}'. Available employees: ${availableEmployeesCount}`);
              }

              const requiredGenders = [];
              if (shift.gender) {
                const shiftGenders: string[] = typeof shift.gender === 'string' && shift.gender.includes(',')
                  ? shift.gender.split(',').map((g: string) => g.trim()).filter(g => g)
                  : Array.isArray(shift.gender)
                  ? shift.gender.filter(g => g)
                  : [shift.gender].filter(g => g);
                requiredGenders.push(...shiftGenders);
              }

              timefoldShifts.push({
                id: `${role}_${shiftCounter++}`,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                location: "Hospital",
                requiredSkill: role,
                gender: requiredGenders,
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

  const startTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startHour,
      startMinute,
      startSecond
    );

  let endTime = 
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute, endSecond);

  // If end time is earlier than start time, assume it goes to the next day
  if (endTime <= startTime) {
    endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
  }

  return { startTime, endTime };
}
