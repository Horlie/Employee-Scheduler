import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { employeeId, newRate } = await request.json();

    if (typeof employeeId !== "string" || typeof newRate !== "number") {
      return NextResponse.json({ error: "Invalid input data." }, { status: 400 });
    }

    if (newRate < 0.0 || newRate > 1.0) {
      return NextResponse.json({ error: "Rate must be between 0.0 and 1.0." }, { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(employeeId) },
      data: { rate: newRate },
    });

    return NextResponse.json({ message: "Rate updated successfully.", employee: updatedEmployee });
  } catch (error) {
    console.error("Error updating employee rate:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
