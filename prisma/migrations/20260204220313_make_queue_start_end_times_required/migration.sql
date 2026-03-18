/*
  Warnings:

  - Made the column `endQueueAt` on table `Queue` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startQueueAt` on table `Queue` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Queue" ALTER COLUMN "endQueueAt" SET NOT NULL,
ALTER COLUMN "startQueueAt" SET NOT NULL;
