/*
  Warnings:

  - You are about to drop the column `stripeCharge` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "stripeCharge",
ADD COLUMN     "stripeChargeId" TEXT;
