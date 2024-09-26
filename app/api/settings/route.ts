import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    const { email, monthlyHours, dailyShiftsPerWorkerPerMonth, roleSettings } = await request.json();

    // Validate presence of email an
    if (!email) {
        console.log('Missing email in the request.');
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // If only email an are present, treat it as a fetch request
    if (monthlyHours === undefined && dailyShiftsPerWorkerPerMonth === undefined && roleSettings === undefined) {
        

        const settings = await prisma.user.findUnique({
            where: { email: email },
            select: {
                dailyShiftsPerWorkerPerMonth: true,
                monthlyHours: true,
                roleSettings: true,
            },
        });


        if (!settings) {
            console.log('Settings not found for user');
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }

        return NextResponse.json(settings);
    }



    // Validate input
    if (
        typeof dailyShiftsPerWorkerPerMonth !== 'number' ||
        typeof monthlyHours !== 'number' ||
        typeof roleSettings !== 'object'
    ) {
        console.log('Invalid input received:', { dailyShiftsPerWorkerPerMonth, monthlyHours, roleSettings });
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const updatedSettings = await prisma.user.update({
        where: { email: email },
        data: {
            dailyShiftsPerWorkerPerMonth,
            monthlyHours,
            roleSettings,
        },
    });


    return NextResponse.json(updatedSettings);
}