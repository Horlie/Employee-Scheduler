import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/app/lib/prisma";
import { Gender } from "@/app/types/scheduler"; 

export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();

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
    // Support comma-separated roles in CSV
    const allowedGenders = Object.values(Gender);
    const employeesToCreate = [];
    for (const [index, record] of records.entries()) {
      const roleString = record[1] || "";
      const rolesArray = roleString.split(",").map((r: string) => r.trim().toUpperCase()).filter((r: string) => r.length > 0);
      const genderValue = record[2];
      if (!allowedGenders.includes(genderValue)) {
        return NextResponse.json({
          error: `Invalid gender value '${genderValue}' in row ${index + 1}. Allowed values: ${allowedGenders.join(", ")}.`,
          row: index + 1,
          value: genderValue,
        }, { status: 400 });
      }
      employeesToCreate.push({
        name: record[0],
        roles: rolesArray,
        gender: genderValue,
        userId: Number(userId),
      });
    }
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
