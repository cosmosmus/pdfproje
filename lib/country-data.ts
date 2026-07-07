import { COUNTRY_CENTROIDS } from "./country-centroids";

export interface CityDatum {
  /// null = şehir çözülemedi ("Bilinmiyor" pini, ülke merkezinde gösterilir).
  name: string | null;
  count: number;
  lat: number;
  lng: number;
}

export interface CountryDatum {
  code: string;
  count: number;
  cities: CityDatum[];
}

interface VisitGeo {
  country: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/// Ziyaret listesini harita için ülke → şehir kırılımına toplar.
/// Şehri bilinmeyen ziyaretler (eski kayıtlar dahil) ülke merkezinde tek
/// "Bilinmiyor" pininde toplanır. Şehir koordinatı, o şehre düşen
/// ziyaretlerin ortalamasıdır.
export function aggregateCountryData(visits: VisitGeo[]): CountryDatum[] {
  const byCountry = new Map<string, Map<string, { count: number; latSum: number; lngSum: number; coordCount: number }>>();

  for (const v of visits) {
    if (!v.country) continue;
    let cities = byCountry.get(v.country);
    if (!cities) {
      cities = new Map();
      byCountry.set(v.country, cities);
    }
    const hasCoords = typeof v.latitude === "number" && typeof v.longitude === "number";
    const cityKey = v.city && hasCoords ? v.city : "";
    const bucket = cities.get(cityKey) ?? { count: 0, latSum: 0, lngSum: 0, coordCount: 0 };
    bucket.count += 1;
    if (hasCoords) {
      bucket.latSum += v.latitude as number;
      bucket.lngSum += v.longitude as number;
      bucket.coordCount += 1;
    }
    cities.set(cityKey, bucket);
  }

  return Array.from(byCountry.entries()).map(([code, cityMap]) => {
    const centroid = COUNTRY_CENTROIDS[code];
    const cities: CityDatum[] = [];
    let total = 0;
    for (const [name, b] of cityMap) {
      total += b.count;
      const lat = b.coordCount > 0 ? b.latSum / b.coordCount : centroid?.[0];
      const lng = b.coordCount > 0 ? b.lngSum / b.coordCount : centroid?.[1];
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      cities.push({ name: name || null, count: b.count, lat, lng });
    }
    cities.sort((a, b) => b.count - a.count);
    return { code, count: total, cities };
  });
}
