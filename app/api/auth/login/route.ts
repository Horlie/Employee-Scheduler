import { NextResponse } from "next/server";
import { authenticateUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { email, password } = await request.json();

    try {
      const user = await authenticateUser(email, password);
      if (user) {
        return NextResponse.json({ message: "Login successful", user });
      } else {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
      }
    } catch (error) {
      console.error("Login error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
