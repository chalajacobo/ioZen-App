-- CreateEnum
CREATE TYPE "ChatflowStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('AI', 'USER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "status" "ChatflowStatus" NOT NULL DEFAULT 'DRAFT',
    "shareUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "chatflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatflow_submissions" (
    "id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "data" JSONB NOT NULL DEFAULT '{}',
    "aiSummary" TEXT,
    "aiInsights" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatflowId" TEXT NOT NULL,

    CONSTRAINT "chatflow_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "fieldName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "chatflows_shareUrl_key" ON "chatflows"("shareUrl");

-- CreateIndex
CREATE INDEX "chatflows_userId_idx" ON "chatflows"("userId");

-- CreateIndex
CREATE INDEX "chatflows_shareUrl_idx" ON "chatflows"("shareUrl");

-- CreateIndex
CREATE INDEX "chatflow_submissions_chatflowId_idx" ON "chatflow_submissions"("chatflowId");

-- CreateIndex
CREATE INDEX "chatflow_submissions_status_idx" ON "chatflow_submissions"("status");

-- CreateIndex
CREATE INDEX "chatflow_submissions_createdAt_idx" ON "chatflow_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_messages_submissionId_idx" ON "conversation_messages"("submissionId");

-- CreateIndex
CREATE INDEX "conversation_messages_createdAt_idx" ON "conversation_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "chatflows" ADD CONSTRAINT "chatflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatflow_submissions" ADD CONSTRAINT "chatflow_submissions_chatflowId_fkey" FOREIGN KEY ("chatflowId") REFERENCES "chatflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "chatflow_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
