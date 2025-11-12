-- AlterTable
-- Add role column as nullable to handle existing rows
ALTER TABLE "TimefoldShift" ADD COLUMN     "role" TEXT;
