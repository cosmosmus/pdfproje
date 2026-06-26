import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { PDFDocument } from "pdf-lib";
import { pdf } from "pdf-to-img";
import { prisma } from "@/lib/db";
import { saveDocumentFile } from "@/lib/storage";
import { requireAdmin } from "@/lib/admin-session";
import { thumbnailKey } from "@/lib/thumbnails";

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

  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: "PDF 512MB'tan küçük olmalı" }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "A title is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let pageCount: number;
  try {
    const pdf = await PDFDocument.load(buffer);
    pageCount = pdf.getPageCount();
  } catch {
    return NextResponse.json({ error: "Could not parse PDF" }, { status: 400 });
  }

  const slug = nanoid(10);
  const storageKey = `documents/${slug}.pdf`;

  await saveDocumentFile(storageKey, buffer);

  const document = await prisma.document.create({
    data: {
      slug,
      title: title.trim(),
      originalFilename: file.name,
      storageKey,
      pageCount,
      fileSizeBytes: buffer.byteLength,
    },
  });

  // Best-effort: page thumbnails power the analytics chart hover preview.
  // Don't fail the upload if rendering a handful of pages goes wrong.
  try {
    const doc = await pdf(buffer, { scale: 1 });
    let pageNumber = 0;
    for await (const pageBuffer of doc) {
      pageNumber += 1;
      await saveDocumentFile(thumbnailKey(document.id, pageNumber), pageBuffer, "image/png");
    }
  } catch (err) {
    console.error("Thumbnail generation failed for document", document.id, err);
  }

  return NextResponse.json({ id: document.id, slug: document.slug });
}
