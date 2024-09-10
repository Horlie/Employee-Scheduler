import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { employeeId, date, status } = await request.json();

  try {
    const availability = await prisma.employeeAvailability.upsert({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId),
          date: new Date(date),
        },
      },
      update: { status },
      create: {
        employeeId: parseInt(employeeId),
        date: new Date(date),
        status,
      },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error updating employee availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  if (!employeeId || !date) {
    return NextResponse.json({ error: 'Missing employeeId or date' }, { status: 400 });
  }

  try {
    await prisma.employeeAvailability.delete({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId),
          date: new Date(date),
        },
      },
    });

    return NextResponse.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
  }

  try {
    const availability = await prisma.employeeAvailability.findMany({
      where: {
        employeeId: parseInt(employeeId),
      },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching employee availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}