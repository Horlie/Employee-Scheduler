/*
  Warnings:

  - Added the required column `role` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "role" TEXT NOT NULL;
