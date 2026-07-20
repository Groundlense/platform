"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStampable = isStampable;
exports.stampGeoTag = stampGeoTag;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const sharp_1 = __importDefault(require("sharp"));
const STAMPABLE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
function isStampable(mimeType) {
    return !!mimeType && STAMPABLE_MIME_TYPES.includes(mimeType);
}
function logoCandidatePaths() {
    const names = ['groundlense-logo.png', 'Groundlense_logo.jpeg'];
    const roots = [
        (0, path_1.join)(__dirname, '..', '..', 'assets'),
        (0, path_1.join)(process.cwd(), 'assets'),
        (0, path_1.join)(process.cwd(), 'apps', 'api', 'assets'),
    ];
    const candidates = [process.env.STAMP_LOGO_PATH];
    for (const name of names) {
        for (const root of roots)
            candidates.push((0, path_1.join)(root, name));
    }
    return candidates.filter((p) => !!p);
}
async function loadLogo() {
    for (const path of logoCandidatePaths()) {
        try {
            return await (0, promises_1.readFile)(path);
        }
        catch {
        }
    }
    return null;
}
function esc(v) {
    return v
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function formatCoord(lat, lng) {
    const latHemi = lat >= 0 ? 'N' : 'S';
    const lngHemi = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}°${latHemi}  ${Math.abs(lng).toFixed(6)}°${lngHemi}`;
}
function formatIst(iso) {
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
function buildLines(info) {
    const lines = [];
    const idParts = [info.boreholeCode, info.subStructure].filter(Boolean);
    if (idParts.length)
        lines.push(idParts.join('  ·  '));
    const structParts = [
        info.structureType ? `Structure: ${info.structureType}` : null,
        info.chainage ? `Chainage: ${info.chainage}` : null,
        info.span ? `Span: ${info.span}` : null,
    ].filter(Boolean);
    if (structParts.length)
        lines.push(structParts.join('   |   '));
    if (info.gpsLat != null && info.gpsLng != null) {
        const acc = info.accuracyM != null ? `  (±${Math.round(info.accuracyM)} m)` : '';
        lines.push(`GPS: ${formatCoord(info.gpsLat, info.gpsLng)}${acc}`);
    }
    else {
        lines.push('GPS: not captured');
    }
    lines.push(formatIst(info.takenAt));
    return lines;
}
async function stampGeoTag(filePath, info) {
    const original = await (0, promises_1.readFile)(filePath);
    const orientedBuffer = await (0, sharp_1.default)(original).rotate().toBuffer();
    const oriented = (0, sharp_1.default)(orientedBuffer);
    const { width, height } = await oriented.metadata();
    if (!width || !height)
        throw new Error('Image has no dimensions');
    const lines = buildLines(info);
    const fontSize = Math.max(13, Math.round(width * 0.024));
    const lineGap = Math.round(fontSize * 1.45);
    const padX = Math.round(fontSize * 0.9);
    const padY = Math.round(fontSize * 0.8);
    const brandSize = Math.round(fontSize * 1.15);
    let logoImg = null;
    let brandRowH = brandSize;
    const rawLogo = await loadLogo();
    if (rawLogo) {
        try {
            const targetH = Math.round(brandSize * 2.6);
            logoImg = await (0, sharp_1.default)(rawLogo)
                .resize({
                height: targetH,
                width: Math.round(width * 0.5),
                fit: 'inside',
            })
                .png()
                .toBuffer();
            brandRowH = targetH;
        }
        catch {
            logoImg = null;
        }
    }
    const bannerHeight = padY * 2 + brandRowH + Math.round(fontSize * 0.5) + lines.length * lineGap;
    const textStartY = padY + brandRowH + Math.round(fontSize * 0.5);
    const textRows = lines
        .map((line, i) => `<text x="${padX}" y="${textStartY + (i + 1) * lineGap - Math.round(lineGap * 0.3)}" ` +
        `font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" fill="#FFFFFF">${esc(line)}</text>`)
        .join('\n    ');
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
    const layers = [
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
    await (0, sharp_1.default)(stamped).toFile(filePath);
}
//# sourceMappingURL=photo-stamp.js.map