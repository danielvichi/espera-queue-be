/*
  Warnings:

  - Made the column `clientId` on table `Admin` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Admin" DROP CONSTRAINT "Admin_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Admin" ALTER COLUMN "clientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Admin" ADD CONSTRAINT "Admin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
