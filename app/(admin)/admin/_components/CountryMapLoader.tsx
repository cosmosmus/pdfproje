"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at module load time, so it can never run during SSR.
const CountryMap = dynamic(() => import("./CountryMap"), {
  ssr: false,
  loading: () => <p className="text-gray-400 text-sm">Harita yükleniyor...</p>,
});

export default function CountryMapLoader({
  countries,
}: {
  countries: { code: string; count: number }[];
}) {
  return <CountryMap countries={countries} />;
}
