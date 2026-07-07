import nodemailer from "nodemailer";
import { getResend, getMailFrom } from "./resend";

function isSmtpConfigured(): boolean {
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

export async function sendDocumentLinkEmail({
  to,
  documentTitle,
  link,
}: {
  to: string;
  documentTitle: string;
  link: string;
}): Promise<void> {
  const subject = `${documentTitle} - Döküman Linki`;
  const text = `Merhaba,\n\n"${documentTitle}" dökümanını görüntülemek için aşağıdaki linke tıklayabilirsiniz:\n\n${link}\n\nİyi günler.`;
  const html = `<p>Merhaba,</p><p><strong>${documentTitle}</strong> dökümanını görüntülemek için aşağıdaki linke tıklayabilirsiniz:</p><p><a href="${link}">${link}</a></p><p>İyi günler.</p>`;

  // Toplu mail tarafıyla aynı servis: Resend. SMTP yalnızca Resend
  // yapılandırılmamışsa denenir (eski kurulumlar için).
  if (isResendConfigured()) {
    const { error } = await getResend().emails.send({
      from: getMailFrom(),
      to,
      subject,
      text,
      html,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    return;
  }

  if (!isSmtpConfigured()) {
    throw new Error("RESEND_API_KEY (veya SMTP_HOST/SMTP_USER/SMTP_PASSWORD) tanımlı değil");
  }

  await transporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

export { isSmtpConfigured };
