import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { employeeId, month, data } = await request.json();
    console.log("Saving data to database:", data);

    try {
      const schedule = await prisma.schedule.upsert({
        where: {
          userId_month: {
            userId: employeeId,
            month: month,
          },
        },
        update: {
          data: data,
        },
        create: {
          userId: employeeId,
          month: month,
          data: data,
        },
      });

      return new Response(JSON.stringify({ success: true, schedule }), { status: 200 });
    } catch (error) {
      console.error("Error upserting schedule:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to save schedule." }), {
        status: 500,
      });
    }
  } catch (error) {
    console.error("Error upserting schedule:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to save schedule." }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
}
