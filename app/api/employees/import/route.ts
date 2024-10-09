import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // For demonstration, assume userId is sent in form data
    const formData = await request.formData();
    const userId = formData.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId in form data." }, { status: 400 });
    }

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileContent = await file.text();

    // Parse CSV synchronously
    const records = parse(fileContent, {
      skip_empty_lines: true,
      trim: true,
      delimiter: ";",
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty." }, { status: 400 });
    }

    // Prepare data for insertion
    const employeesToCreate = records.map((record: any) => ({
      name: record[0],
      role: record[1],
      userId: Number(userId),
    }));
    console.log(employeesToCreate);
    // Insert employees into the database
    await prisma.employee.createMany({
      data: employeesToCreate,
    });

    return NextResponse.json({ success: true, employeesToCreate }, { status: 200 });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
