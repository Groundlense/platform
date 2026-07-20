import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';

/**
 * Geo-tag banner burned into field photos at upload time (like the GPS map
 * cameras used on site). Every value on the stamp is real: borehole context
 * comes from the database record, coordinates and capture time come from the
 * device. Fields the record doesn't have are omitted — never fabricated.
 */
export interface StampInfo {
  boreholeCode?: string | null;
  /** Borehole name — the sub-structure the hole belongs to (abutment/pier). */
  subStructure?: string | null;
  structureType?: string | null;
  chainage?: string | null;
  span?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  accuracyM?: number | null;
  takenAt?: string | null;
}

const STAMPABLE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isStampable(mimeType?: string | null): boolean {
  return !!mimeType && STAMPABLE_MIME_TYPES.includes(mimeType);
}

/**
 * Company logo for the stamp. Drop the file at apps/api/assets/stamp-logo.png
 * (or point STAMP_LOGO_PATH at it). When present it replaces the drawn
 * pin+wordmark; when absent the vector fallback keeps the stamp working.
 */
function logoCandidatePaths(): string[] {
  // Transparent PNG preferred (sits cleanly on the dark banner); original
  // JPEG kept as fallback.
  const names = ['groundlense-logo.png', 'Groundlense_logo.jpeg'];
  const roots = [
    // Relative to this compiled file (dist/media/ → apps/api/assets/) —
    // works no matter what the process working directory is (Render starts
    // the service from the repo root, local dev from apps/api).
    join(__dirname, '..', '..', 'assets'),
    join(process.cwd(), 'assets'),
    join(process.cwd(), 'apps', 'api', 'assets'),
  ];
  const candidates: Array<string | undefined> = [process.env.STAMP_LOGO_PATH];
  for (const name of names) {
    for (const root of roots) candidates.push(join(root, name));
  }
  return candidates.filter((p): p is string => !!p);
}

async function loadLogo(): Promise<Buffer | null> {
  for (const path of logoCandidatePaths()) {
    try {
      return await readFile(path);
    } catch {
      // try next candidate
    }
  }
  return null;
}

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCoord(lat: number, lng: number): string {
  const latHemi = lat >= 0 ? 'N' : 'S';
  const lngHemi = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}°${latHemi}  ${Math.abs(lng).toFixed(6)}°${lngHemi}`;
}

function formatIst(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const valid = !Number.isNaN(d.getTime()) ? d : new Date();
  const date = valid.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = valid.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${date}, ${time} IST`;
}

/** Builds the banner text lines from whatever real data exists. */
function buildLines(info: StampInfo): string[] {
  const lines: string[] = [];

  const idParts = [info.boreholeCode, info.subStructure].filter(Boolean);
  if (idParts.length) lines.push(idParts.join('  ·  '));

  const structParts = [
    info.structureType ? `Structure: ${info.structureType}` : null,
    info.chainage ? `Chainage: ${info.chainage}` : null,
    info.span ? `Span: ${info.span}` : null,
  ].filter(Boolean);
  if (structParts.length) lines.push(structParts.join('   |   '));

  if (info.gpsLat != null && info.gpsLng != null) {
    const acc =
      info.accuracyM != null ? `  (±${Math.round(info.accuracyM)} m)` : '';
    lines.push(`GPS: ${formatCoord(info.gpsLat, info.gpsLng)}${acc}`);
  } else {
    lines.push('GPS: not captured');
  }

  lines.push(formatIst(info.takenAt));

  return lines;
}

/**
 * Composites the geo-tag banner onto the bottom of the image, in place.
 * Throws on failure — the caller decides whether an unstamped photo is
 * acceptable (it is: losing the upload would be worse than losing the stamp).
 */
export async function stampGeoTag(
  filePath: string,
  info: StampInfo,
): Promise<void> {
  // Read into memory so writing the stamped result back to the same path
  // never fights sharp's file-handle cache (Windows locks open files).
  // Bake EXIF rotation into the pixels first: metadata() reports
  // pre-rotation dimensions, and the banner must match the upright photo.
  const original = await readFile(filePath);
  const orientedBuffer = await sharp(original).rotate().toBuffer();
  const oriented = sharp(orientedBuffer);
  const { width, height } = await oriented.metadata();
  if (!width || !height) throw new Error('Image has no dimensions');

  const lines = buildLines(info);

  // Everything scales off the image width so the stamp is readable on both
  // thumbnails from old phones and 12MP captures.
  const fontSize = Math.max(13, Math.round(width * 0.024));
  const lineGap = Math.round(fontSize * 1.45);
  const padX = Math.round(fontSize * 0.9);
  const padY = Math.round(fontSize * 0.8);
  const brandSize = Math.round(fontSize * 1.15);

  // Company logo file, when provided — replaces the drawn pin+wordmark.
  let logoImg: Buffer | null = null;
  let brandRowH = brandSize;
  const rawLogo = await loadLogo();
  if (rawLogo) {
    try {
      // Generous height so square-ish logos stay legible on the banner.
      const targetH = Math.round(brandSize * 2.6);
      logoImg = await sharp(rawLogo)
        .resize({
          height: targetH,
          width: Math.round(width * 0.5),
          fit: 'inside',
        })
        .png()
        .toBuffer();
      brandRowH = targetH;
    } catch {
      logoImg = null; // unreadable logo file — fall back to the vector brand
    }
  }

  const bannerHeight =
    padY * 2 + brandRowH + Math.round(fontSize * 0.5) + lines.length * lineGap;
  const textStartY = padY + brandRowH + Math.round(fontSize * 0.5);

  const textRows = lines
    .map(
      (line, i) =>
        `<text x="${padX}" y="${textStartY + (i + 1) * lineGap - Math.round(lineGap * 0.3)}" ` +
        `font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" fill="#FFFFFF">${esc(line)}</text>`,
    )
    .join('\n    ');

  // Vector fallback brand (location pin + wordmark) — only when no logo file.
  const pinR = Math.round(brandSize * 0.32);
  const pinCx = padX + pinR;
  const pinCy = padY + Math.round(brandSize * 0.45);
  const vectorBrand = logoImg
    ? ''
    : `<circle cx="${pinCx}" cy="${pinCy}" r="${pinR}" fill="none" stroke="#D85A30" stroke-width="${Math.max(2, Math.round(pinR * 0.35))}"/>
    <circle cx="${pinCx}" cy="${pinCy}" r="${Math.max(1, Math.round(pinR * 0.3))}" fill="#D85A30"/>
    <text x="${pinCx + pinR + Math.round(fontSize * 0.6)}" y="${pinCy + Math.round(brandSize * 0.32)}" ` +
      `font-family="DejaVu Sans, Arial, sans-serif" font-size="${brandSize}" font-weight="bold" fill="#FFFFFF">GROUNDLENSE</text>`;

  const svg = `<svg width="${width}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${width}" height="${bannerHeight}" fill="#000000" fill-opacity="0.62"/>
    <rect x="0" y="0" width="${width}" height="${Math.max(2, Math.round(fontSize * 0.14))}" fill="#D85A30"/>
    ${vectorBrand}
    ${textRows}
  </svg>`;

  const layers: OverlayOptions[] = [
    { input: Buffer.from(svg), top: height - bannerHeight, left: 0 },
  ];
  if (logoImg) {
    layers.push({
      input: logoImg,
      top: height - bannerHeight + padY,
      left: padX,
    });
  }

  const stamped = await oriented.composite(layers).toBuffer();

  await sharp(stamped).toFile(filePath);
}
