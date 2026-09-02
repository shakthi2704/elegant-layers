/*
  Warnings:

  - You are about to drop the column `productId` on the `Recipe` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Recipe` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/

DELETE FROM "Recipe";
-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_productId_fkey";

-- DropIndex
DROP INDEX "Recipe_productId_key";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "productId",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProductRecipe" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductRecipe_productId_recipeId_key" ON "ProductRecipe"("productId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");

-- AddForeignKey
ALTER TABLE "ProductRecipe" ADD CONSTRAINT "ProductRecipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecipe" ADD CONSTRAINT "ProductRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
