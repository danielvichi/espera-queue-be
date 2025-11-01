/*
  Warnings:

  - You are about to drop the column `userInQueue` on the `Queue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Queue" DROP COLUMN "userInQueue";

-- CreateTable
CREATE TABLE "public"."QueueInstance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "queueId" TEXT NOT NULL,
    "usersInQueue" TEXT[],
    "attendedUsers" TEXT[],

    CONSTRAINT "QueueInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."QueueInstance" ADD CONSTRAINT "QueueInstance_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "public"."Queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
