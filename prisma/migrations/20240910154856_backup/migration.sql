/*
  Warnings:

  - You are about to drop the column `endTime` on the `EmployeeAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `EmployeeAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `useTimeRange` on the `EmployeeAvailability` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeAvailability" DROP COLUMN "endTime",
DROP COLUMN "startTime",
DROP COLUMN "useTimeRange";
