import nodemailer from "nodemailer";
import { getResend, getMailFrom } from "./resend";

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  );
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /// Gönderen görünen adı, örn. "Decosit" → "Decosit <send@...>".
  fromName?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

function formatFrom(address: string, fromName?: string): string {
  if (!fromName) return address;
  // Görünen addaki tırnak/köşeli karakterleri temizle (header injection önlemi).
  const safe = fromName.replace(/["<>\r\n]/g, "").trim();
  return safe ? `${safe} <${address}>` : address;
}

/**
 * Tek bir e-posta gönderir. Önce Resend denenir; Resend yapılandırılmamışsa
 * ya da (örn. domain doğrulaması eksikse) hata verirse Hostinger SMTP'ye
 * düşer. İkisi de yoksa/başarısızsa hata fırlatır.
 */
export async function sendEmail(mail: OutgoingEmail): Promise<void> {
  let resendError: Error | null = null;

  if (isResendConfigured()) {
    try {
      const { error } = await getResend().emails.send({
        from: formatFrom(getMailFrom(), mail.fromName),
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        replyTo: mail.replyTo,
        headers: mail.headers,
      });
      if (!error) return;
      resendError = new Error(`Resend: ${error.message}`);
    } catch (err) {
      resendError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (isSmtpConfigured()) {
    if (resendError) console.warn("Resend başarısız, SMTP'ye düşülüyor:", resendError.message);
    await transporter().sendMail({
      from: formatFrom(process.env.SMTP_FROM || process.env.SMTP_USER!, mail.fromName),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo,
      headers: mail.headers,
    });
    return;
  }

  throw resendError ?? new Error("RESEND_API_KEY veya SMTP_HOST/SMTP_USER/SMTP_PASSWORD tanımlı değil");
}

export async function sendDocumentLinkEmail({
  to,
  documentTitle,
  link,
}: {
  to: string;
  documentTitle: string;
  link: string;
}): Promise<void> {
  await sendEmail({
    to,
    subject: `${documentTitle} - Döküman Linki`,
    text: `Merhaba,\n\n"${documentTitle}" dökümanını görüntülemek için aşağıdaki linke tıklayabilirsiniz:\n\n${link}\n\nİyi günler.`,
    html: `<p>Merhaba,</p><p><strong>${documentTitle}</strong> dökümanını görüntülemek için aşağıdaki linke tıklayabilirsiniz:</p><p><a href="${link}">${link}</a></p><p>İyi günler.</p>`,
  });
}
