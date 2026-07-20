/**
 * Coordinate handling — identical logic to the web portal, so both apps read
 * the same DB values the same way. Borehole coordinates are entered during
 * project setup and are always decimal-degree WGS84 by the time they reach
 * the app: the web Excel import now requires the uploader to explicitly
 * declare "Decimal Degrees" or "UTM — zone N/S" and converts deterministically
 * at that point, never by guessing the format from the numbers.
 *
 * There is deliberately no "detect and auto-convert" helper here anymore — a
 * heuristic guess (e.g. treating any 6/7-digit number as UTM zone 43N) can
 * silently produce a plausible-looking but physically wrong location, which
 * is unacceptable for guiding a field worker to a borehole. rawDecimalCoords
 * is the only accessor: it uses a value only when it's already valid decimal
 * degrees, and returns null (never a guess) otherwise.
 */

/** UTM → WGS84. zone/southern must be known, never inferred. */
export function utmToLatLng(
  easting: number,
  northing: number,
  zone: number,
  southern = false,
): { lat: number; lng: number } {
  const k0 = 0.9996;
  const a = 6378137.0;
  const e = 0.0818191908426;
  const e2 = e * e;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const x = easting - 500000;
  const y = southern ? northing - 10000000 : northing;

  const longOrigin = (zone - 1) * 6 - 180 + 3;
  const eccPrimeSquared = e2 / (1 - e2);

  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256));

  const phi1Rad =
    mu +
    ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32) * Math.sin(4 * mu) +
    ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu);

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  const C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  const R1 =
    (a * (1 - e2)) /
    Math.pow(1 - e2 * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  const D = x / (N1 * k0);

  const lat =
    phi1Rad -
    ((N1 * Math.tan(phi1Rad)) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) *
          D * D * D * D) /
          24 +
        ((61 +
          90 * T1 +
          298 * C1 +
          45 * T1 * T1 -
          252 * eccPrimeSquared -
          3 * C1 * C1) *
          D * D * D * D * D * D) /
          720);

  const lng =
    (D -
      ((1 + 2 * T1 + C1) * D * D * D) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) *
        D * D * D * D * D) /
        120) /
    Math.cos(phi1Rad);

  return {
    lat: (lat * 180) / Math.PI,
    lng: (lng * 180) / Math.PI + longOrigin,
  };
}

/**
 * The ORIGINAL coordinates exactly as uploaded — no UTM-detection guessing,
 * no zone assumption. Use this for anything that physically guides a worker
 * to a location. Returns null rather than a guess when the stored value
 * isn't already valid decimal degrees — callers should show "location
 * unavailable", not silently navigate off a guess.
 */
export function rawDecimalCoords(
  rawLat: any,
  rawLng: any,
): { lat: number; lng: number } | null {
  if (rawLat == null || rawLng == null) return null;
  const latN = parseFloat(String(rawLat));
  const lngN = parseFloat(String(rawLng));
  if (isNaN(latN) || isNaN(lngN)) return null;
  if (
    latN >= -90 && latN <= 90 &&
    lngN >= -180 && lngN <= 180 &&
    (latN !== 0 || lngN !== 0)
  ) {
    return { lat: latN, lng: lngN };
  }
  return null;
}
