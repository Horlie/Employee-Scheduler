/*
  Warnings:

  - A unique constraint covering the columns `[userId,month]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Schedule_userId_month_key" ON "Schedule"("userId", "month");
