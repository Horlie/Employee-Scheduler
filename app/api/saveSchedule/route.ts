import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { employeeId, month, data } = await req.json();

  if (!employeeId || !month || !data) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const schedule = await prisma.schedule.create({
      data: {
        userId: employeeId,
        month: month + 1,
        data: data,
      },
    });
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error saving schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
