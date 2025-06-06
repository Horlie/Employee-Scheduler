import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { email, monthlyHours, roleSettings } = await request.json();

    // Validate presence of email an
    if (!email) {
      console.log("Missing email in the request.");
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // If only email an are present, treat it as a fetch request
    if (monthlyHours === undefined && roleSettings === undefined) {
      const settings = await prisma.user.findUnique({
        where: { email: email },
        select: {
          monthlyHours: true,
          roleSettings: true,
        },
      });

      if (!settings) {
        console.log("Settings not found for user");
        return NextResponse.json({ error: "Settings not found" }, { status: 404 });
      }

      return NextResponse.json(settings);
    }

    // Validate input
    if (typeof monthlyHours !== "number" || typeof roleSettings !== "object") {
      console.log("Invalid input received:", { monthlyHours, roleSettings });
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updatedSettings = await prisma.user.update({
      where: { email: email },
      data: {
        monthlyHours,
        roleSettings,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
