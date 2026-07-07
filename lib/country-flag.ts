/**
 * Static SVG flag path for an ISO 3166-1 alpha-2 country code, or null if
 * invalid. Uses bundled SVGs (public/flags/, copied from country-flag-icons
 * at install time) instead of emoji flags — many platforms (notably Windows)
 * don't render flag emoji as flags, only as two separate letter tiles, which
 * next to the plain-text country code looked like the code was shown twice.
 */
export function countryFlagUrl(code: string | null): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  return `/flags/${code.toUpperCase()}.svg`;
}
