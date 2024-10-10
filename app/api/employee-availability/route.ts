import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";

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
          startDate: new Date(startDate),
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
    const employeeIds = searchParams.get("employeeIds");

    if (!employeeIds) {
      return NextResponse.json({ error: "Employee IDs are required" }, { status: 400 });
    }

    const parsedEmployeeIds = employeeIds.split(",").map((id) => parseInt(id));

    const availability = await prisma.employeeAvailability.findMany({
      where: {
        employeeId: {
          in: parsedEmployeeIds,
        },
      },
    });

    const convertedAvailability = availability.map((avail) => ({
      ...avail,
      startDate: convertUTCToLocalDateIgnoringTimezone(avail.startDate),
      finishDate: convertUTCToLocalDateIgnoringTimezone(avail.finishDate),
    }));
    return NextResponse.json({ availability: convertedAvailability });
  } catch (error) {
    console.error("Error fetching employee availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
function convertLocalDateToUTCIgnoringTimezone(date: Date) {
  // Assume the input date is in local time, convert it to UTC
  return formatInTimeZone(date, "Europe/Riga", "yyyy-MM-dd'T'HH:mm:ss.SSS") + "Z";
}

function convertUTCToLocalDateIgnoringTimezone(utcDate: Date) {
  return formatInTimeZone(utcDate, "UTC", "yyyy-MM-dd'T'HH:mm:ss");
}
