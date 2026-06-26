/*
  Warnings:

  - Added the required column `visitId` to the `PageViewEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PageViewEvent" ADD COLUMN     "visitId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "viewerSessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_documentId_idx" ON "Visit"("documentId");

-- CreateIndex
CREATE INDEX "Visit_viewerSessionId_idx" ON "Visit"("viewerSessionId");

-- CreateIndex
CREATE INDEX "PageViewEvent_visitId_idx" ON "PageViewEvent"("visitId");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_viewerSessionId_fkey" FOREIGN KEY ("viewerSessionId") REFERENCES "ViewerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageViewEvent" ADD CONSTRAINT "PageViewEvent_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
