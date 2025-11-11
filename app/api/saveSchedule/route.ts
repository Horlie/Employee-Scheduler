import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    await prisma.$connect();

    const { employeeId, month, data } = await request.json();
    console.log("Saving data to database:", data);
    try {
      await prisma.timefoldShift.deleteMany({
        where: { 
          userId: employeeId,
          month: month
         },
      });
      for (const i in Object.keys(data)) {
        await prisma.timefoldShift.createMany({
          data: data[Object.keys(data)[i]].shifts.map((shift: { employee: { id: any; }; isFullDay: any; start: string | number | Date; end: string | number | Date; })=> ({
            userId: employeeId,
            employeeId: parseInt(shift.employee.id),
            isFullDay: shift.isFullDay,
            start: new Date(shift.start),
            end: new Date(shift.end),
            month: month
          })),
        });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
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