/*
  Warnings:

  - You are about to drop the column `queueId` on the `UserQueued` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserQueued" DROP CONSTRAINT "UserQueued_queueId_fkey";

-- AlterTable
ALTER TABLE "public"."Queue" ADD COLUMN     "userInQueue" TEXT[];

-- AlterTable
ALTER TABLE "public"."UserQueued" DROP COLUMN "queueId";
