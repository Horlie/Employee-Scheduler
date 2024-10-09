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
          startDate: new Date(localToUTC(startDate)),
        },
      },
      update: { finishDate: new Date(localToUTC(finishDate)), status },
      create: {
        employeeId: parseInt(employeeId),
        startDate: new Date(localToUTC(startDate)),
        finishDate: new Date(localToUTC(finishDate)),
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
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const availability = await prisma.employeeAvailability.findMany({
      where: {
        employeeId: parseInt(employeeId),
      },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching employee availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

const localToUTC = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};
