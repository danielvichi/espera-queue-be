-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('CLIENT_ADMIN', 'UNITY_ADMIN', 'QUEUE_ADMIN');

-- CreateEnum
CREATE TYPE "public"."QueueType" AS ENUM ('GENERAL', 'APPOINTMENT', 'SERVICE', 'EVENT', 'PRIORITY', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN DEFAULT true,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "unityId" TEXT,
    "enabled" BOOLEAN DEFAULT true,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Unity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "enabled" BOOLEAN DEFAULT true,

    CONSTRAINT "Unity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserQueued" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "queueId" TEXT,
    "enabled" BOOLEAN DEFAULT true,

    CONSTRAINT "UserQueued_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Queue" (
    "id" TEXT NOT NULL,
    "type" "public"."QueueType" NOT NULL DEFAULT 'GENERAL',
    "name" TEXT,
    "minWaitingTime" INTEGER,
    "maxWaitingTime" INTEGER,
    "currentWaitingTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "unityId" TEXT,
    "adminId" TEXT,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_cnpj_key" ON "public"."Client"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "public"."Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Unity_phone_key" ON "public"."Unity"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Unity_email_key" ON "public"."Unity"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserQueued_email_key" ON "public"."UserQueued"("email");

-- AddForeignKey
ALTER TABLE "public"."Admin" ADD CONSTRAINT "Admin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admin" ADD CONSTRAINT "Admin_unityId_fkey" FOREIGN KEY ("unityId") REFERENCES "public"."Unity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unity" ADD CONSTRAINT "Unity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserQueued" ADD CONSTRAINT "UserQueued_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "public"."Queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Queue" ADD CONSTRAINT "Queue_unityId_fkey" FOREIGN KEY ("unityId") REFERENCES "public"."Unity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Queue" ADD CONSTRAINT "Queue_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
