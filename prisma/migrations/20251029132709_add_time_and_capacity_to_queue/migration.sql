-- AlterTable
ALTER TABLE "public"."Queue" ADD COLUMN     "endQueueAt" TEXT,
ADD COLUMN     "maxUsersInQueue" INTEGER,
ADD COLUMN     "startQueueAt" TEXT;
