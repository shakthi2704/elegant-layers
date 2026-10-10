-- CreateEnum
CREATE TYPE "WasteReason" AS ENUM ('EXPIRED', 'NOT_COLLECTED', 'DAMAGED', 'OTHER');

-- AlterTable
ALTER TABLE "InventoryTransaction" ADD COLUMN     "wasteReason" "WasteReason";
