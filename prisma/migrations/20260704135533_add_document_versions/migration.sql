-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "documentVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing document becomes version 1, so old stats stay attached
-- to a selectable version. Existing Visit rows already default to documentVersion = 1.
INSERT INTO "DocumentVersion" ("id", "documentId", "version", "pageCount", "originalFilename", "fileSizeBytes", "createdAt")
SELECT gen_random_uuid(), "id", 1, "pageCount", "originalFilename", "fileSizeBytes", "createdAt"
FROM "Document";
