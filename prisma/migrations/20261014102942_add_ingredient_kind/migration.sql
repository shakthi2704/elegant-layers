-- CreateEnum
CREATE TYPE "IngredientKind" AS ENUM ('INGREDIENT', 'SUPPLY');

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "kind" "IngredientKind" NOT NULL DEFAULT 'INGREDIENT';
