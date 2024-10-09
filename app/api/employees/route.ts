import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const employees = await prisma.employee.findMany({
      where: {
        userId: parseInt(userId),
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
  }

  try {
    await prisma.employee.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, role, userId } = await request.json();

  try {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        name: name,
        userId: parseInt(userId),
      },
    });

    let employee;
    if (existingEmployee) {
      employee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          role,
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          name,
          role,
          userId: parseInt(userId),
        },
      });
    }
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
