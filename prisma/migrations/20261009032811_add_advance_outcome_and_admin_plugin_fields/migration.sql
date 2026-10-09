-- CreateEnum
CREATE TYPE "AdvanceOutcome" AS ENUM ('KEPT', 'REFUNDED');

-- AlterTable
ALTER TABLE "CakeOrder" ADD COLUMN     "advanceOutcome" "AdvanceOutcome",
ADD COLUMN     "advanceOutcomeAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;
