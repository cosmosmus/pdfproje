import { NextRequest, NextResponse, after } from "next/server";
import { PDFDocument } from "pdf-lib";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { readDocumentFile, statDocumentFile } from "@/lib/storage";
import { generateThumbnails } from "@/lib/thumbnails";
import { MAX_PDF_SIZE_BYTES, MAX_PDF_SIZE_LABEL } from "@/lib/upload-limits";

export const maxDuration = 120; // büyük PDF'in okunması + sayfa sayımı

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

  const body = await request.json().catch(() => null);
  const originalFilename = body?.originalFilename;
  if (typeof originalFilename !== "string" || originalFilename.length === 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const size = await statDocumentFile(document.storageKey);
  if (size === null) {
    return NextResponse.json({ error: "Dosya depolamada bulunamadı, yükleme tamamlanmamış olabilir" }, { status: 400 });
  }
  if (size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: `PDF ${MAX_PDF_SIZE_LABEL}'tan küçük olmalı` }, { status: 400 });
  }

  const buffer = await readDocumentFile(document.storageKey);

  let pageCount: number;
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    pageCount = pdfDoc.getPageCount();
  } catch {
    return NextResponse.json({ error: "PDF okunamadı" }, { status: 400 });
  }

  const newVersion = document.version + 1;

  // Old-version thumbnails stay in their own thumbnails/{id}/v{n}/ folder so the
  // stats page can still show page previews for past versions. Generation runs
  // after the response so a big PDF doesn't block the replace.
  after(async () => {
    try {
      await generateThumbnails(document.id, newVersion, buffer);
    } catch (err) {
      console.error("Thumbnail regeneration failed for document", document.id, err);
    }
  });

  const updated = await prisma.document.update({
    where: { id },
    data: {
      pageCount,
      fileSizeBytes: buffer.byteLength,
      originalFilename,
      version: newVersion,
      versions: {
        create: {
          version: newVersion,
          pageCount,
          originalFilename,
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
