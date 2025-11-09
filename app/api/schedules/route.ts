import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const month = searchParams.get('month');

  if (!userId || !month) {
    return NextResponse.json(
      { error: 'Missing userId or month parameters' },
      { status: 400 }
    );
  }
  
  try {
    const schedule = await prisma.timefoldShift.findMany({
      where: {
        month: parseInt(month),
        userId: parseInt(userId),
      },
    });

    if (!schedule) {
      return NextResponse.json({}); 
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}