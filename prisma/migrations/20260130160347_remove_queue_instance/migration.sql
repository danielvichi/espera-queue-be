/*
  Warnings:

  - You are about to drop the `QueueInstance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QueueInstance" DROP CONSTRAINT "QueueInstance_queueId_fkey";

-- DropTable
DROP TABLE "QueueInstance";
