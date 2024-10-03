import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany();
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { add, delete: deleteIds } = await request.json();

    // Add new shifts
    if (add && Array.isArray(add)) {
      for (const shift of add) {
        const userId = parseInt(shift.userId);
        if (isNaN(userId)) {
          return NextResponse.json({ error: "Invalid userId." }, { status: 400 });
        }

        // Check if the user exists
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
          return NextResponse.json(
            { error: `User with id ${userId} does not exist.` },
            { status: 404 }
          );
        }

        await prisma.shift.create({
          data: {
            startTime: shift.startTime,
            endTime: shift.endTime,
            isFullDay: shift.isFullDay,
            days: { set: shift.days },
            role: { set: shift.role },
            user: { connect: { id: userId } },
          },
        });
      }
    }

    // Delete shifts
    if (deleteIds && Array.isArray(deleteIds)) {
      for (const id of deleteIds) {
        await prisma.shift.delete({
          where: { id },
        });
      }
    }

    const updatedShifts = await prisma.shift.findMany();
    return NextResponse.json(updatedShifts);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to update shifts." }, { status: 500 });
  }
}
