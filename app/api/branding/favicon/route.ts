import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readDocumentFile } from "@/lib/storage";

export async function GET(request: NextRequest) {
  // Site geneli favicon: ilk kurulan (sahip) hesabın favicon'u esastır.
  const admin = await prisma.adminUser.findFirst({
    where: { faviconStorageKey: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { faviconStorageKey: true, faviconContentType: true },
  });

  // Yüklenmiş favicon yoksa uygulamanın varsayılanına dön.
  if (!admin?.faviconStorageKey || !admin.faviconContentType) {
    return NextResponse.redirect(new URL("/favicon.ico", request.url), 307);
  }

  try {
    const buffer = await readDocumentFile(admin.faviconStorageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": admin.faviconContentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/favicon.ico", request.url), 307);
  }
}
