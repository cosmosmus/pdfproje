/** Very rough UA -> "Browser on OS" label, just for display in the dashboard. Not for fingerprinting. */
export function describeUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Bilinmiyor";

  let browser = "Bilinmeyen tarayıcı";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua) && /version\//i.test(ua)) browser = "Safari";

  let os = "";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  return os ? `${browser} · ${os}` : browser;
}
