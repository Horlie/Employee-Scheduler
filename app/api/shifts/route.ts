import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    await prisma.$connect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "UserId is required." }, { status: 400 });
    }

    const shifts = await prisma.shift.findMany({
      where: {
        userId: parseInt(userId),
      },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifts." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { add, delete: deleteIds, userId, numberEmployeesToSplitAt, hourToSplitAt } = await request.json();

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: "Invalid userId." }, { status: 400 });
    }

    // Add new shifts
    if (add && Array.isArray(add)) {
      for (const shift of add) {
        // Check if the user exists
        const userExists = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
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
            roles: { set: shift.roles },
            userId: parseInt(userId),
            numberToSplitAt: numberEmployeesToSplitAt,
            hourToSplitAt: hourToSplitAt
          },
        });
        const shiftString = shift.isFullDay
          ? `FullDay (${shift.startTime.slice(0, -3)} - ${shift.endTime.slice(0, -3)})`
          : `${shift.startTime.slice(0, -3)}-${shift.endTime.slice(0, -3)}`;

        
        let json = "{";
        for (const role of shift.roles) {
            json += 
            `"${role}":{
              "${shiftString}":{
                "Friday": 1,
                "Monday": 1,
                "Sunday": 1,
                "Tuesday": 1,
                "Saturday": 1,
                "Thursday": 1,
                "Wednesday": 1
              }
            },`;
        }
        json = json.slice(0, json.length);
        json += "}";
        
      

        await prisma.user.update({
          where: { id: parseInt(userId) },
          data: {
            roleSettings: json
          }
        });
      }
    }

    // Delete shifts
    if (deleteIds && Array.isArray(deleteIds)) {
      await prisma.shift.deleteMany({
        where: {
          id: { in: deleteIds },
          userId: parseInt(userId),
        },
      });
    }

    const updatedShifts = await prisma.shift.findMany({
      where: {
        userId: parseInt(userId),
      },
    });
    return NextResponse.json(updatedShifts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update shifts." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
