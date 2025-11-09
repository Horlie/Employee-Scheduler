import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();

    const { schedule, userId, month } = await request.json(); // весь массив смен

    if (!Array.isArray(schedule) || !userId || !month) { // Проверка входных данных, типо если расписания нет
      return NextResponse.json({ error: "Invalid data provided." }, { status: 400 });
    }
    
    await prisma.$transaction(
      schedule.map((shift) =>
        prisma.timefoldShift.update({
          where: { id: shift.id },
          data: {
            start: new Date(shift.start),
            end: new Date(shift.end),
            isFullDay: shift.isFullDay,
          },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Schedule updated successfully." });

  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}