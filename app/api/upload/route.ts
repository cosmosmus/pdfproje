import { NextRequest, NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/db";
import { saveDocumentFile } from "@/lib/storage";
import { requireAdmin } from "@/lib/admin-session";
import { generateThumbnails } from "@/lib/thumbnails";

export const maxDuration = 120; // büyük PDF'ler için timeout

const MAX_PDF_SIZE_BYTES = 512 * 1024 * 1024; // 512MB

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title");
  const slugInput = formData.get("slug");

  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: "PDF 512MB'tan küçük olmalı" }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "A title is required" }, { status: 400 });
  }

  let slug: string;
  if (typeof slugInput === "string" && slugInput.trim().length > 0) {
    slug = slugInput.trim();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Slug yalnızca küçük harf, rakam ve tire içerebilir" }, { status: 400 });
    }
    const existing = await prisma.document.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Bu slug zaten kullanılıyor, farklı bir slug deneyin" }, { status: 400 });
    }
  } else {
    slug = nanoid(10);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let pageCount: number;
  try {
    const pdf = await PDFDocument.load(buffer);
    pageCount = pdf.getPageCount();
  } catch {
    return NextResponse.json({ error: "Could not parse PDF" }, { status: 400 });
  }

  const storageKey = `documents/${slug}.pdf`;

  try {
    await saveDocumentFile(storageKey, buffer);
  } catch (err) {
    console.error("PDF storage write failed", storageKey, err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `PDF depolamaya kaydedilemedi (${detail}). S3/R2 ayarlarını kontrol edin.` },
      { status: 500 }
    );
  }

  const document = await prisma.document.create({
    data: {
      slug,
      title: title.trim(),
      originalFilename: file.name,
      storageKey,
      pageCount,
      fileSizeBytes: buffer.byteLength,
      versions: {
        create: {
          version: 1,
          pageCount,
          originalFilename: file.name,
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
