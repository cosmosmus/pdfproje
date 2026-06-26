import { Resend } from "resend";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY tanımlı değil");
  return new Resend(key);
}

export function getMailFrom() {
  return process.env.MAIL_FROM ?? "onboarding@resend.dev";
}
