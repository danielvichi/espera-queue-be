/*
  Warnings:

  - Made the column `enabled` on table `Admin` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enabled` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enabled` on table `Queue` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enabled` on table `Unity` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enabled` on table `UserQueued` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Admin" ALTER COLUMN "enabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Client" ALTER COLUMN "enabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Queue" ALTER COLUMN "enabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Unity" ALTER COLUMN "enabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserQueued" ALTER COLUMN "enabled" SET NOT NULL;
