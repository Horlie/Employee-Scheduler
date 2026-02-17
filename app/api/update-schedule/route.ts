import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();

    const { schedule, deletedShiftIds, userId, month } = await request.json(); 

    if (!Array.isArray(schedule) || !userId || !month) { 
      return NextResponse.json({ error: "Invalid data provided." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {

      if (Array.isArray(deletedShiftIds) && deletedShiftIds.length > 0) {
        await tx.timefoldShift.deleteMany({
          where: {
            id: {
              in: deletedShiftIds.map((id: any) => Number(id)),
            },
          },
        });
        console.log(`Deleted ${deletedShiftIds.length} shifts.`);
      }
      for (const shift of schedule) {
        await tx.timefoldShift.upsert({       
            where: { id: shift.id },
            update: {
              start: new Date(shift.start || shift.startDate),
                end: new Date(shift.end || shift.finishDate),
              isFullDay: shift.isFullDay,
              role: shift.role || null, 
              employeeId: shift.employeeId,
            },
            create: {
              start: new Date(shift.start || shift.startDate),
                end: new Date(shift.end || shift.finishDate),
              isFullDay: shift.isFullDay,
              month: month,
              userId: userId,
              employeeId: shift.employeeId,
              role: shift.role || null 
            },
        });
      }
    });


    return NextResponse.json({ success: true, message: "Schedule updated successfully." });

  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}