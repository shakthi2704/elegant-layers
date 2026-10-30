-- AlterTable
ALTER TABLE "CakeOrder" ADD COLUMN     "complimentaryReason" TEXT,
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isComplimentary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "complimentaryReason" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "isComplimentary" BOOLEAN NOT NULL DEFAULT false;
