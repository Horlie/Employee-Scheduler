-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "rate" SET DEFAULT 1.0;

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
