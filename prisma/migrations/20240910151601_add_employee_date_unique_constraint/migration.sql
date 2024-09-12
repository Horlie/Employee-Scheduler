/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,date]` on the table `EmployeeAvailability` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "EmployeeAvailability_employeeId_date_startTime_endTime_key";

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAvailability_employeeId_date_key" ON "EmployeeAvailability"("employeeId", "date");
