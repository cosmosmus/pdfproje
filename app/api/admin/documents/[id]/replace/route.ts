import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { pdf } from "pdf-to-img";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { saveDocumentFile } from "@/lib/storage";
import { thumbnailKey } from "@/lib/thumbnails";

export const maxDuration = 120; // büyük PDF'lerde thumbnail üretimi uzun sürebilir

const MAX_PDF_SIZE_BYTES = 256 * 1024 * 1024; // 256MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Döküman bulunamadı" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Bir PDF dosyası gerekli" }, { status: 400 });
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: "PDF 256MB'tan küçük olmalı" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let pageCount: number;
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    pageCount = pdfDoc.getPageCount();
  } catch {
    return NextResponse.json({ error: "PDF okunamadı" }, { status: 400 });
  }

  const newVersion = document.version + 1;

  await saveDocumentFile(document.storageKey, buffer);

  // Old-version thumbnails stay in their own thumbnails/{id}/v{n}/ folder so the
  // stats page can still show page previews for past versions.
  try {
    const thumbs = await pdf(buffer, { scale: 1 });
    let pageNumber = 0;
    for await (const pageBuffer of thumbs) {
      pageNumber += 1;
      await saveDocumentFile(thumbnailKey(document.id, newVersion, pageNumber), pageBuffer, "image/png");
    }
  } catch (err) {
    console.error("Thumbnail regeneration failed for document", document.id, err);
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      pageCount,
      fileSizeBytes: buffer.byteLength,
      originalFilename: file.name,
      version: newVersion,
      versions: {
        create: {
          version: newVersion,
          pageCount,
          originalFilename: file.name,
          fileSizeBytes: buffer.byteLength,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    pageCount: updated.pageCount,
    version: updated.version,
    updatedAt: updated.updatedAt,
  });
}
