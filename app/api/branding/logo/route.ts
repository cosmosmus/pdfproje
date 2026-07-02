import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readDocumentFile } from "@/lib/storage";

export async function GET() {
  const admin = await prisma.adminUser.findFirst({
    select: { logoStorageKey: true, logoContentType: true },
  });

  if (!admin?.logoStorageKey || !admin.logoContentType) {
    return NextResponse.json({ error: "Logo yok" }, { status: 404 });
  }

  try {
    const buffer = await readDocumentFile(admin.logoStorageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": admin.logoContentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
        // SVG doğrudan adres çubuğunda açılırsa bile script çalışamasın.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Logo bulunamadı" }, { status: 404 });
  }
}
