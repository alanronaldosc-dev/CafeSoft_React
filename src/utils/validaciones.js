/**
 * Valida que una URL sea un enlace legítimo de Google Maps.
 *
 * Se permiten las formas oficiales:
 *   - https://maps.google.com/...
 *   - https://maps.google.com.mx/...        (variantes de país)
 *   - https://www.google.com/maps/...       (y variantes: google.com.mx, google.es, ...)
 *   - https://maps.app.goo.gl/...           (enlace corto oficial)
 *   - https://goo.gl/maps/...               (enlace corto legacy)
 *
 * Rechaza javascript:, data:, URLs relativas, http y dominios
 * parecidos (p. ej. https://maps.google.com.evil.com o
 * https://www.google.evil.com/maps), evitando Open Redirect / XSS.
 *
 * El campo es opcional: una cadena vacía se considera válida.
 */
export function esUrlGoogleMapsValida(url) {
  if (typeof url !== "string") return false;

  const limpia = url.trim();
  if (limpia === "") return true;

  let parsed;
  try {
    parsed = new URL(limpia);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  const ruta = parsed.pathname;

  // 1. maps.google.com (cualquier ruta) y variantes de país
  if (
    host === "maps.google.com" ||
    /^maps\.google\.[a-z]{2,3}(\.[a-z]{2,3})?$/.test(host)
  ) {
    return true;
  }

  // 2. Enlace corto oficial de Google Maps
  if (host === "maps.app.goo.gl") {
    return true;
  }

  // 3. goo.gl/maps/...
  if (host === "goo.gl" && ruta.startsWith("/maps")) {
    return true;
  }

  // 4. www.google.com/maps/... y variantes de país
  if (
    ruta.startsWith("/maps") &&
    /^www\.google\.[a-z]{2,3}(\.[a-z]{2,3})?$/.test(host)
  ) {
    return true;
  }

  return false;
}
