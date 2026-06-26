"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { COUNTRY_CENTROIDS, countryDisplayName } from "@/lib/country-centroids";

type CountryDatum = { code: string; count: number };

export default function CountryMap({ countries }: { countries: CountryDatum[] }) {
  const points = countries
    .map((c) => ({ ...c, centroid: COUNTRY_CENTROIDS[c.code] }))
    .filter((c): c is CountryDatum & { centroid: [number, number] } => Boolean(c.centroid));

  if (points.length === 0) {
    return <p className="text-ink/40 text-sm">Henüz konum verisi yok.</p>;
  }

  const maxCount = Math.max(...points.map((p) => p.count));

  return (
    <MapContainer
      center={[20, 10]}
      zoom={1.5}
      style={{ height: 320, width: "100%", borderRadius: 12 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.code}
          center={p.centroid}
          radius={8 + (p.count / maxCount) * 14}
          pathOptions={{ color: "#0B7E73", fillColor: "#0EA99B", fillOpacity: 0.45, weight: 1.5 }}
        >
          <Popup>
            {countryDisplayName(p.code)} — {p.count} görüntüleme
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
