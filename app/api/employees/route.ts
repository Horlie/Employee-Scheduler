import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    await prisma.$connect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const employees = await prisma.employee.findMany({
      where: {
        userId: parseInt(userId),
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    await prisma.$connect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    await prisma.employee.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { name, role, userId, gender } = await request.json();

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        name: name,
        userId: parseInt(userId),
        gender
      },
    });

    let employee;
    if (existingEmployee) {
      employee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          role: role.toUpperCase(),
          gender
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          name,
          role: role.toUpperCase(),
          userId: parseInt(userId),
          gender
        },
      });
    }
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }

}

export async function PUT(request: Request) {
  try {
    await prisma.$connect();

    const response = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    console.log(response);

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    let newEmployee = await prisma.employee.update({
      where: { id: response.id },
      data: {
        name: response.name,
        role: response.role,
        gender: response.gender
      },
    });
    return NextResponse.json({ message: "Employee deleted successfully" });
  }
  catch (error) {
    console.error("Error modifying employee:", error);
    return NextResponse.json({ error: "Failed to modify employee" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
  
}