/*
  Warnings:

  - You are about to drop the column `dailyShiftsPerWorkerPerMonth` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "dailyShiftsPerWorkerPerMonth",
ADD COLUMN     "dailyShiftSettings" JSONB;
