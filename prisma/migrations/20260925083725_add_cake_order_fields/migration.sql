-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_DEPOSIT');

-- AlterTable
ALTER TABLE "CakeOrder" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "shape" TEXT;
