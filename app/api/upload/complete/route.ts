import { NextRequest, NextResponse, after } from "next/server";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { readDocumentFile, statDocumentFile } from "@/lib/storage";
import { generateThumbnails } from "@/lib/thumbnails";
import { MAX_PDF_SIZE_BYTES, MAX_PDF_SIZE_LABEL } from "@/lib/upload-limits";

export const maxDuration = 120; // büyük PDF'in okunması + sayfa sayımı

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const slug = body?.slug;
  const title = body?.title;
  const originalFilename = body?.originalFilename;
  // nanoid ile üretilen slug'lar büyük harf ve alt çizgi içerebilir.
  if (
    typeof slug !== "string" || !/^[a-zA-Z0-9_-]+$/.test(slug) ||
    typeof title !== "string" || title.trim().length === 0 ||
    typeof originalFilename !== "string" || originalFilename.length === 0
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.document.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });
  }

  const storageKey = `documents/${slug}.pdf`;
  const size = await statDocumentFile(storageKey);
  if (size === null) {
    return NextResponse.json({ error: "Dosya depolamada bulunamadı, yükleme tamamlanmamış olabilir" }, { status: 400 });
  }
  if (size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: `PDF ${MAX_PDF_SIZE_LABEL}'tan küçük olmalı` }, { status: 400 });
  }

  const buffer = await readDocumentFile(storageKey);

  let pageCount: number;
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    pageCount = pdfDoc.getPageCount();
  } catch {
    return NextResponse.json({ error: "Could not parse PDF" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      slug,
      title: title.trim(),
      originalFilename,
      storageKey,
      pageCount,
      fileSizeBytes: buffer.byteLength,
      versions: {
        create: {
          version: 1,
          pageCount,
          originalFilename,
          fileSizeBytes: buffer.byteLength,
        },
      },
    },
  });

  // Best-effort: page thumbnails power the analytics chart hover preview.
  // Generated after the response so a big PDF doesn't block the upload.
  after(async () => {
    try {
      await generateThumbnails(document.id, 1, buffer);
    } catch (err) {
      console.error("Thumbnail generation failed for document", document.id, err);
    }
  });

  return NextResponse.json({ id: document.id, slug: document.slug });
}
