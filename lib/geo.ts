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

export interface GeoInfo {
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

const EMPTY_GEO: GeoInfo = { country: null, city: null, latitude: null, longitude: null };

/**
 * Offline lookup using geoip-lite's bundled MaxMind snapshot. Fast and has no
 * external dependency, but the snapshot is only as fresh as the last
 * `npm run updatedb` — datacenter/VPN IP ranges (which get reassigned
 * between countries far more often than residential ISP ranges) drift out
 * of date within months. Kept as the fallback when the live lookup fails.
 */
export function lookupGeo(ip: string | null): GeoInfo {
  if (!ip) return EMPTY_GEO;
  const result = geoip.lookup(ip);
  if (!result) return EMPTY_GEO;
  return {
    country: result.country ?? null,
    city: result.city || null,
    latitude: result.ll?.[0] ?? null,
    longitude: result.ll?.[1] ?? null,
  };
}

/**
 * Live geolocation via ipwho.is (free, no API key, HTTPS). More accurate than
 * the bundled offline snapshot, especially for hosting/VPN IP ranges that
 * change country assignment frequently. Falls back to the offline lookup on
 * any failure or timeout so tracking never breaks due to a third-party
 * outage. Only call this once per new Visit — not on every page-view batch.
 */
export async function lookupGeoLive(ip: string | null): Promise<GeoInfo> {
  if (!ip) return EMPTY_GEO;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return lookupGeo(ip);
    const data = await res.json();
    if (!data.success) return lookupGeo(ip);
    return {
      country: data.country_code ?? null,
      city: data.city || null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
    };
  } catch {
    return lookupGeo(ip);
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
