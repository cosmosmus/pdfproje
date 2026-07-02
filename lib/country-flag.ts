/** Converts an ISO 3166-1 alpha-2 country code (e.g. "TR") to its emoji flag (🇹🇷), or null if invalid. */
export function countryFlag(code: string | null): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
