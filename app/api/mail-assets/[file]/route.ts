import { NextRequest, NextResponse } from "next/server";
import { readDocumentFile } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/// Toplu maillere eklenen görseller. Halka açık (mail istemcisi çeker) ama
/// dosya adları tahmin edilemez nanoid'ler.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const match = file.match(/^([A-Za-z0-9_-]{10,32})\.(png|jpg|webp|gif)$/);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readDocumentFile(`mail-assets/${file}`);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[match[2]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
