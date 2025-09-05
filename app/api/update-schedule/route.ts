import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();

    const { schedule, userId, month } = await request.json(); // весь массив смен

    if (!Array.isArray(schedule) || !userId || !month) { // Проверка входных данных, типо если расписания нет
      return NextResponse.json({ error: "Invalid data provided." }, { status: 400 });
    }
    
    const updatedDataJson = schedule.reduce((acc, shift) => { // преобразовать данные в формат базы данных, проверить есть ли у shift employee.role
        const role = shift.employee?.role;
        if (!role) {
          return acc; // Пропускаем смены без роли
        }

        if (!acc[role]) {
          acc[role] = { shifts: [] };
        }
        acc[role].shifts.push({ 
            id: shift.id.toString(), // Timefold ждет ид строкой ?
            start: new Date(shift.startDate).toISOString(),
            end: new Date(shift.finishDate).toISOString(),
            isFullDay: shift.isFullDay || false,
            employee: { name: shift.employee.name }, 
        });
        return acc;
    }, {} as Record<string, { shifts: any[] }>);


    await prisma.schedule.upsert({
      where: {
        userId_month: {
          userId: userId,
          month: month,
        },
      },
      update: {
        data: updatedDataJson, // Сохраняем унифицированные данные
      },
      create: {
        userId: userId,
        month: month,
        data: updatedDataJson, // Создаем запись с теми же данными, если ее нет
      },
    });

    return NextResponse.json({ success: true, message: "Schedule updated successfully." });

  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}