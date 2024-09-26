-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "rate" SET DEFAULT 0.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyShiftsPerWorkerPerMonth" INTEGER,
ADD COLUMN     "monthlyHours" INTEGER,
ADD COLUMN     "roleSettings" JSONB;
