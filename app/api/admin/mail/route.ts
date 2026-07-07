import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { getMailFrom } from "@/lib/resend";
import { saveDocumentFile } from "@/lib/storage";

export const maxDuration = 60;

const schema = z.object({
  to: z.array(z.string().email()).min(1).max(500),
  subject: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(10_000),
  imageBase64: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp|gif);base64,/)
    .max(2_800_000) // ~2MB dosyanın base64 hali
    .optional(),
  docLink: z.string().url().max(500).startsWith("http").optional(),
  docTitle: z.string().max(200).optional(),
  plain: z.boolean().optional(),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const msg =
      first?.path[0] === "to"
        ? "En az bir geçerli alıcı seçin"
        : first?.path[0] === "subject"
        ? "Konu boş olamaz (en fazla 200 karakter)"
        : first?.path[0] === "text"
        ? "Mesaj boş olamaz (en fazla 10.000 karakter)"
        : first?.path[0] === "imageBase64"
        ? first.code === "too_big"
          ? "Görsel çok büyük, en fazla ~2MB olmalı"
          : "Desteklenmeyen görsel formatı: PNG, JPEG, WEBP veya GIF kullanın (HEIC/HEIF gibi formatlar desteklenmiyor)"
        : first?.path[0] === "docLink"
        ? "Geçersiz döküman linki"
        : "Geçersiz bilgi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { to, subject, text, imageBase64, docLink, docTitle, plain } = parsed.data;

  const adminUser = await prisma.adminUser.findUnique({
    where: { email: admin },
    select: { companyName: true, contactEmail: true, logoStorageKey: true },
  });
  const companyName = adminUser?.companyName ?? "Vitrin";
  // Yanıtlar ve abonelik çıkışları gönderen kutusuna (MAIL_FROM) düşer;
  // ayrı bir reply-to koymuyoruz ki alıcı tarafında beklenmedik bir adres
  // görünmesin (kullanıcı isteği: info@... alıcıda görünmesin).
  const unsubscribeAddress = getMailFrom();
  // Profildeki logo maillerde mutlak URL ile gösterilir (mail istemcisi
  // uygulama sunucusundan çeker; /api/branding/logo halka açık).
  const logoUrl = adminUser?.logoStorageKey
    ? `${request.nextUrl.origin}/api/branding/logo`
    : null;

  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px 0">${line || "&nbsp;"}</p>`)
    .join("");

  const headerHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${escapeHtml(companyName)}" height="40" style="height:40px;max-width:200px;display:block;margin:0 auto" />`
    : `<p style="margin:0;font-size:15px;font-weight:700;color:#20232b;letter-spacing:0.04em">${escapeHtml(companyName)}</p>`;

  // Gmail base64 (data URI) gömülü görselleri hiç göstermez; görseli
  // depolamaya kaydedip normal URL ile referans veriyoruz.
  let imageHtml = "";
  if (imageBase64) {
    const match = imageBase64.match(/^data:image\/(png|jpeg|webp|gif);base64,([\s\S]+)$/);
    if (match) {
      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const key = `mail-assets/${nanoid(16)}.${ext}`;
      try {
        await saveDocumentFile(key, Buffer.from(match[2], "base64"), `image/${match[1]}`);
        const imageUrl = `${request.nextUrl.origin}/api/mail-assets/${key.split("/")[1]}`;
        imageHtml = `<div style="margin:24px 0"><img src="${imageUrl}" alt="" style="max-width:100%;border-radius:8px" /></div>`;
      } catch (err) {
        console.error("Mail görseli depolamaya kaydedilemedi", err);
        return NextResponse.json({ error: "Görsel kaydedilemedi, tekrar deneyin" }, { status: 500 });
      }
    }
  }

  const linkHtml = docLink
    ? `<div style="margin:32px 0;text-align:center">
        <a href="${escapeHtml(docLink)}" style="display:inline-block;background:#20232b;color:#fff;font-weight:600;font-size:14px;padding:13px 32px;border-radius:9999px;text-decoration:none">
          ${escapeHtml(docTitle ?? "View Document")}
        </a>
      </div>`
    : "";

  // "Sade görünüm": logo/kart/renkli buton yok, düz metin bir mektup gibi
  // görünür. Gmail'in "bu bir kampanya" sinyali için baktığı en güçlü
  // ipuçları (marka görseli, belirgin CTA butonu, kart tasarımı) kalktığı
  // için Tanıtımlar sekmesine düşme ihtimali azalır — garanti değildir,
  // sınıflandırma tamamen Gmail'e ait.
  const plainLinkHtml = docLink
    ? `<p style="margin:20px 0 0"><a href="${escapeHtml(docLink)}" style="color:#20232b">${escapeHtml(docTitle ?? "View document")}</a></p>`
    : "";

  const html = plain
    ? `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#20232b;font-size:15px;line-height:1.7">
  <div style="max-width:520px;margin:0 auto">
    ${escapedText}
    ${imageHtml}
    ${plainLinkHtml}
    <p style="margin:32px 0 0;font-size:12px;color:#9ca3af">
      — ${escapeHtml(companyName)}<br>
      <a href="mailto:${unsubscribeAddress}?subject=Unsubscribe" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
    : `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
        <tr><td align="center" style="padding:0 0 28px">
          ${headerHtml}
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:14px;padding:36px 40px">
          <div style="font-size:15px;line-height:1.7;color:#20232b">${escapedText}</div>
          ${imageHtml}
          ${linkHtml}
        </td></tr>
        <tr><td align="center" style="padding:24px 20px 0">
          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;text-align:center">
            You received this email from ${escapeHtml(companyName)}.<br>
            <a href="mailto:${unsubscribeAddress}?subject=Unsubscribe" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Alıcı başına ayrı gönderim: sendEmail önce Resend'i dener, gerekirse
  // SMTP'ye düşer. Paralellik sınırlı tutuluyor (SMTP sunucuları ve Resend
  // rate limitleri için).
  const CONCURRENCY = 5;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < to.length; i += CONCURRENCY) {
    const chunk = to.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((email) =>
        sendEmail({
          to: email,
          subject,
          html,
          fromName: companyName,
          headers: {
            "List-Unsubscribe": `<mailto:${unsubscribeAddress}?subject=Unsubscribe>`,
          },
        })
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") sent += 1;
      else {
        failed += 1;
        console.error("Toplu mail gönderimi başarısız:", r.reason);
      }
    }
  }

  return NextResponse.json({ sent, failed });
}
