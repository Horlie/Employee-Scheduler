import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { employeeId, startDate, finishDate, status } = await request.json();
    const availability = await prisma.employeeAvailability.upsert({
      where: {
        employeeId_startDate: {
          employeeId: parseInt(employeeId),
          startDate: convertLocalDateToUTCIgnoringTimezone(new Date(startDate)),
        },
      },
      update: { finishDate: convertLocalDateToUTCIgnoringTimezone(new Date(finishDate)), status },
      create: {
        employeeId: parseInt(employeeId),
        startDate: convertLocalDateToUTCIgnoringTimezone(new Date(startDate)),
        finishDate: convertLocalDateToUTCIgnoringTimezone(new Date(finishDate)),
        status,
      },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error updating employee availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    await prisma.$connect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");

    if (!employeeId || !startDate) {
      return NextResponse.json({ error: "Missing employeeId or startDate" }, { status: 400 });
    }

    await prisma.employeeAvailability.delete({
      where: {
        employeeId_startDate: {
          employeeId: parseInt(employeeId),
          startDate: convertUTCToLocalDateIgnoringTimezone(new Date(startDate)),
        },
      },
    });

    return NextResponse.json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  try {
    await prisma.$connect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const availability = await prisma.employeeAvailability.findMany({
      where: {
        employeeId: parseInt(employeeId),
      },
    });
    availability.forEach((availability) => {
      availability.startDate = convertUTCToLocalDateIgnoringTimezone(availability.startDate);
      availability.finishDate = convertUTCToLocalDateIgnoringTimezone(availability.finishDate);
    });
    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching employee availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export function convertLocalDateToUTCIgnoringTimezone(date: Date) {
  const timestamp = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );

  return new Date(timestamp);
}

export function convertUTCToLocalDateIgnoringTimezone(utcDate: Date) {
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds(),
    utcDate.getUTCMilliseconds()
  );
}
