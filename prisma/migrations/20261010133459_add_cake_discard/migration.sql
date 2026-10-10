-- AlterTable
ALTER TABLE "CakeOrder" ADD COLUMN     "cakeDiscardReason" "WasteReason",
ADD COLUMN     "cakeDiscardedAt" TIMESTAMP(3);
