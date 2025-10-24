/*
  Warnings:

  - You are about to drop the column `currentWaitingTime` on the `Queue` table. All the data in the column will be lost.
  - You are about to drop the column `maxWaitingTime` on the `Queue` table. All the data in the column will be lost.
  - You are about to drop the column `minWaitingTime` on the `Queue` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `Queue` table without a default value. This is not possible if the table is not empty.
  - Made the column `unityId` on table `Queue` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Queue" DROP CONSTRAINT "Queue_unityId_fkey";

-- AlterTable
ALTER TABLE "public"."Queue" DROP COLUMN "currentWaitingTime",
DROP COLUMN "maxWaitingTime",
DROP COLUMN "minWaitingTime",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "currentWaitingTimeInMinutes" INTEGER,
ADD COLUMN     "maxWaitingTimeInMinutes" INTEGER,
ADD COLUMN     "minWaitingTimeInMinutes" INTEGER,
ALTER COLUMN "unityId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Queue" ADD CONSTRAINT "Queue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Queue" ADD CONSTRAINT "Queue_unityId_fkey" FOREIGN KEY ("unityId") REFERENCES "public"."Unity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
