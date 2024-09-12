-- AlterTable
ALTER TABLE "EmployeeAvailability" 
RENAME COLUMN "date" TO "startDate";

ALTER TABLE "EmployeeAvailability" 
ADD COLUMN "finishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set finishDate to startDate + 1 day
UPDATE "EmployeeAvailability"
SET "finishDate" = "startDate" + INTERVAL '1 day'
WHERE "finishDate" = CURRENT_TIMESTAMP;

-- Remove the default constraint
ALTER TABLE "EmployeeAvailability" 
ALTER COLUMN "finishDate" DROP DEFAULT;