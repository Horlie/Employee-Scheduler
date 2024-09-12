/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,date,startTime,endTime]` on the table `EmployeeAvailability` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endTime` to the `EmployeeAvailability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `EmployeeAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EmployeeAvailability_employeeId_date_key";

-- AlterTable
ALTER TABLE "EmployeeAvailability" ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAvailability_employeeId_date_startTime_endTime_key" ON "EmployeeAvailability"("employeeId", "date", "startTime", "endTime");
