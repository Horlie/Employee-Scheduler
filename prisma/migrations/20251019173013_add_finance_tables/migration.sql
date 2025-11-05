/*
  Warnings:

  - Added the required column `hourToSplitAt` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberToSplitAt` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "hourToSplitAt" TEXT NOT NULL,
ADD COLUMN     "numberToSplitAt" TEXT NOT NULL;
