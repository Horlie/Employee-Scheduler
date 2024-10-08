/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Employee_id_key" ON "Employee"("id");
