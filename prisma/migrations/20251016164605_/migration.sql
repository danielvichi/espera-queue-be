-- DropForeignKey
ALTER TABLE "public"."Admin" DROP CONSTRAINT "Admin_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Admin" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Admin" ADD CONSTRAINT "Admin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
