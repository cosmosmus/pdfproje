"use client";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { COUNTRY_CENTROIDS, countryDisplayName } from "@/lib/country-centroids";
import type { CountryDatum } from "@/lib/country-data";

const WORLD_CENTER: [number, number] = [20, 10];
const WORLD_ZOOM = 1.5;

function pinIcon(count: number, maxCount: number, variant: "country" | "city"): L.DivIcon {
  const scale = maxCount > 0 ? count / maxCount : 0;
  const size = variant === "country" ? 30 + Math.round(scale * 12) : 24 + Math.round(scale * 8);
  const bg = variant === "country" ? "#0B7E73" : "#0EA99B";
  const fontSize = size >= 36 ? 14 : 12;
  const html = `
    <div style="position:relative;width:${size}px;height:${size + 7}px;">
      <div style="width:${size}px;height:${size}px;background:${bg};border:2px solid #fff;border-radius:9999px;
        box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:700;font-size:${fontSize}px;font-family:ui-sans-serif,system-ui,sans-serif;">
        ${count}
      </div>
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:0;height:0;
        border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${bg};"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "", // leaflet'in varsayılan beyaz kutusunu kapat
    iconSize: [size, size + 7],
    iconAnchor: [size / 2, size + 7],
    popupAnchor: [0, -(size + 7)],
    tooltipAnchor: [0, -(size + 7)],
  });
}

/// Seçim değişince haritayı uçurur: ülke seçildiyse şehir pinlerini
/// kapsayacak şekilde yaklaşır, seçim kalkınca dünya görünümüne döner.
function FlyController({ selected }: { selected: CountryDatum | null }) {
  const map = useMap();
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const key = selected?.code ?? null;
  if (key !== prevKey) {
    setPrevKey(key);
    if (selected && selected.cities.length > 0) {
      const bounds = L.latLngBounds(selected.cities.map((c) => [c.lat, c.lng] as [number, number]));
      map.flyToBounds(bounds.pad(0.4), { maxZoom: 7, duration: 0.8 });
    } else {
      map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.8 });
    }
  }
  return null;
}

export default function CountryMap({ countries }: { countries: CountryDatum[] }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const points = countries
    .map((c) => ({ ...c, position: COUNTRY_CENTROIDS[c.code] ?? (c.cities[0] ? [c.cities[0].lat, c.cities[0].lng] : undefined) }))
    .filter((c): c is CountryDatum & { position: [number, number] } => Boolean(c.position));

  if (points.length === 0) {
    return <p className="text-ink/40 text-sm">Henüz konum verisi yok.</p>;
  }

  const selected = points.find((p) => p.code === selectedCode) ?? null;
  const maxCountryCount = Math.max(...points.map((p) => p.count));
  const maxCityCount = selected ? Math.max(...selected.cities.map((c) => c.count)) : 0;

  return (
    <div className="relative">
      <MapContainer
        center={WORLD_CENTER}
        zoom={WORLD_ZOOM}
        style={{ height: 320, width: "100%", borderRadius: 12 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FlyController selected={selected} />

        {!selected &&
          points.map((p) => (
            <Marker
              key={p.code}
              position={p.position}
              icon={pinIcon(p.count, maxCountryCount, "country")}
              eventHandlers={{ click: () => setSelectedCode(p.code) }}
            >
              <Tooltip direction="top">
                {countryDisplayName(p.code)} — {p.count} görüntüleme · şehirler için tıkla
              </Tooltip>
            </Marker>
          ))}

        {selected &&
          selected.cities.map((c) => (
            <Marker
              key={`${selected.code}-${c.name ?? "?"}`}
              position={[c.lat, c.lng]}
              icon={pinIcon(c.count, maxCityCount, "city")}
            >
              <Popup>
                {c.name ?? "Bilinmiyor"} — {c.count} görüntüleme
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {selected && (
        <button
          type="button"
          onClick={() => setSelectedCode(null)}
          className="absolute top-3 right-3 z-[1000] bg-surface text-ink text-xs font-semibold rounded-full px-3 py-1.5 shadow-md hover:bg-surface-muted transition-colors"
        >
          ← {countryDisplayName(selected.code)} · tüm ülkeler
        </button>
      )}
    </div>
  );
}
