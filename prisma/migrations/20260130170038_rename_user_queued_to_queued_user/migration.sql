/*
  Warnings:

  - You are about to drop the `UserQueued` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "QueuedUserStatus" AS ENUM ('WAITING', 'SERVICED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "UserQueued" DROP CONSTRAINT "UserQueued_queueId_fkey";

-- DropForeignKey
ALTER TABLE "UserQueued" DROP CONSTRAINT "UserQueued_userId_fkey";

-- DropTable
DROP TABLE "UserQueued";

-- DropEnum
DROP TYPE "UserQueuedStatus";

-- CreateTable
CREATE TABLE "QueuedUser" (
    "id" TEXT NOT NULL,
    "numberOfSeats" INTEGER NOT NULL,
    "status" "QueuedUserStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "servedAt" TIMESTAMP(3),
    "queueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "QueuedUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QueuedUser" ADD CONSTRAINT "QueuedUser_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueuedUser" ADD CONSTRAINT "QueuedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
