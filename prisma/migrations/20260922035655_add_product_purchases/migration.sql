-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_ingredientId_fkey";

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "itemType" "InventoryItemType" NOT NULL DEFAULT 'INGREDIENT',
ADD COLUMN     "productId" TEXT,
ALTER COLUMN "ingredientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
