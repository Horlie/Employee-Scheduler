import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, month, data } = body;


    if (!data) {
      console.error("No data provided in request body.");
      return NextResponse.json({ success: false, error: "No data" }, { status: 400 });
    }

    const roleKeys = Object.keys(data);
    
    await prisma.$connect();

    const dbEmployees = await prisma.employee.findMany({
      where: {
        userId: Number(employeeId),
      },
    });

    const employeeNameMap = new Map<string, number>();
    dbEmployees.forEach(emp => {
      employeeNameMap.set(emp.name, emp.id);
    });


    await prisma.$transaction(async (tx) => {
      const deleted = await tx.timefoldShift.deleteMany({
        where: {
          userId: Number(employeeId),
          month: Number(month),
        },
      });

      for (const roleKey of roleKeys) {
        const roleData = data[roleKey];
        const shifts = roleData?.shifts || [];


        if (shifts.length === 0) continue;

        const shiftsToSave: any[] = [];

        for (const shift of shifts) {
          if (!shift.employee || !shift.employee.name) {
            continue; 
          }

          const dbEmployeeId = employeeNameMap.get(shift.employee.name);

          if (!dbEmployeeId) {
            console.warn(` Employee not found in DB: ${shift.employee.name}. Skipping shift.`);
            continue;
          }

          shiftsToSave.push({
            userId: Number(employeeId),
            employeeId: dbEmployeeId,
            isFullDay: Boolean(shift.isFullDay),
            start: new Date(shift.start),
            end: new Date(shift.end),
            month: Number(month),
            role: shift.requiredSkill || roleKey || null
          });
        }


        if (shiftsToSave.length > 0) {
          await tx.timefoldShift.createMany({
            data: shiftsToSave,
          });
        } else {
            console.warn(`No valid shifts to save for role: ${roleKey}`);
        }
      }
    });  
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error();
    return NextResponse.json(
      { success: false, error: "Failed to save schedule."},
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}