import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { employeeId, newRate } = await request.json();

  if (typeof employeeId !== 'string' || typeof newRate !== 'number') {
    return NextResponse.json({ error: 'Invalid input data.' }, { status: 400 });
  }

  if (newRate < 0.0 || newRate > 1.0) {
    return NextResponse.json({ error: 'Rate must be between 0.0 and 1.0.' }, { status: 400 });
  }

  try {
    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(employeeId) },
      data: { rate: newRate },
    });

    return NextResponse.json({ message: 'Rate updated successfully.', employee: updatedEmployee });
  } catch (error) {
    console.error('Error updating employee rate:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}