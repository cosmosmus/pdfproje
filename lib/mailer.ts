import nodemailer from "nodemailer";

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  );
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
  if (!isSmtpConfigured()) {
    throw new Error("SMTP_HOST/SMTP_USER/SMTP_PASSWORD is not configured");
  }

  await transporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `${documentTitle} - Döküman Linki`,
    text: `Merhaba,\n\n"${documentTitle}" dökümanını görüntülemek için aşağıdaki linke tıklayabilirsiniz:\n\n${link}\n\nİyi günler.`,
    html: `<p>Merhaba,</p><p><strong>${documentTitle}</strong> dökümanını görüntülemek için aşağıdaki linke tıklayabilirsiniz:</p><p><a href="${link}">${link}</a></p><p>İyi günler.</p>`,
  });
}

export { isSmtpConfigured };
