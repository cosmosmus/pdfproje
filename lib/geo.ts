export interface GeoInfo {
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

const EMPTY_GEO: GeoInfo = { country: null, city: null, latitude: null, longitude: null };

/**
 * Live geolocation via ipinfo.io. Uses IPINFO_TOKEN when set (free tier:
 * 50k req/month); works unauthenticated at low volume too. Returns empty
 * geo on failure or timeout so tracking never breaks due to an outage —
 * /api/track only calls this for an IP it hasn't located before, so a
 * transient failure doesn't stick to the IP.
 */
export async function lookupGeoLive(ip: string | null): Promise<GeoInfo> {
  if (!ip) return EMPTY_GEO;
  try {
    const token = process.env.IPINFO_TOKEN;
    const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return EMPTY_GEO;
    const data = await res.json();
    if (typeof data.country !== "string" || !data.country) return EMPTY_GEO;
    const [lat, lon] =
      typeof data.loc === "string" ? data.loc.split(",").map(Number) : [NaN, NaN];
    return {
      country: data.country,
      city: typeof data.city === "string" && data.city ? data.city : null,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null,
    };
  } catch {
    return EMPTY_GEO;
  }
}

/** Extracts the originating client IP from a Next.js Request, honoring x-forwarded-for. */
export function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip");
}
