/*
  Warnings:

  - You are about to drop the column `email` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Client` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."AdminRole" ADD VALUE 'CLIENT_OWNER';

-- DropIndex
DROP INDEX "public"."Client_email_key";

-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "email",
DROP COLUMN "passwordHash",
ADD COLUMN     "ownerId" TEXT NOT NULL;
