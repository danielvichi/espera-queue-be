/*
  Warnings:

  - Made the column `clientId` on table `Unity` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Unity" DROP CONSTRAINT "Unity_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Unity" ALTER COLUMN "clientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Unity" ADD CONSTRAINT "Unity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
