-- CreateEnum
CREATE TYPE "UserQueuedStatus" AS ENUM ('WAITING', 'SERVICED', 'CANCELLED');

-- CreateTable
CREATE TABLE "UserQueued" (
    "id" TEXT NOT NULL,
    "numberOfSeats" INTEGER NOT NULL,
    "status" "UserQueuedStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "servedAt" TIMESTAMP(3),
    "queueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserQueued_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserQueued" ADD CONSTRAINT "UserQueued_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueued" ADD CONSTRAINT "UserQueued_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
