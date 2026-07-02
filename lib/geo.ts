import geoip from "geoip-lite";

/** Resolves a client IP to an ISO country code, or null if unresolvable (e.g. localhost/private IPs). */
export function lookupCountry(ip: string | null): string | null {
  if (!ip) return null;
  const result = geoip.lookup(ip);
  return result?.country ?? null;
}

/** Resolves a client IP to an estimated city name, or null if the database has none for that range. */
export function lookupCity(ip: string | null): string | null {
  if (!ip) return null;
  const result = geoip.lookup(ip);
  return result?.city || null;
}

/** Extracts the originating client IP from a Next.js Request, honoring x-forwarded-for. */
export function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip");
}
