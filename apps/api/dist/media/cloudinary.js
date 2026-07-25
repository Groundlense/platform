"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryConfigured = isCloudinaryConfigured;
exports.isRemoteFilePath = isRemoteFilePath;
exports.uploadToCloudinary = uploadToCloudinary;
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
function getConfig() {
    const url = process.env.CLOUDINARY_URL;
    if (url) {
        const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
        if (m) {
            return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
        }
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (cloudName && apiKey && apiSecret) {
        return { cloudName, apiKey, apiSecret };
    }
    return null;
}
function isCloudinaryConfigured() {
    return getConfig() !== null;
}
function isRemoteFilePath(filePath) {
    return /^https?:\/\//i.test(filePath);
}
async function uploadToCloudinary(localPath, opts) {
    const cfg = getConfig();
    if (!cfg) {
        throw new Error('Cloudinary is not configured');
    }
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = `folder=${opts.folder}&timestamp=${timestamp}`;
    const signature = (0, crypto_1.createHash)('sha1')
        .update(paramsToSign + cfg.apiSecret)
        .digest('hex');
    const bytes = await (0, promises_1.readFile)(localPath);
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(bytes)], {
        type: opts.mimeType || 'application/octet-stream',
    }), opts.fileName || 'upload');
    form.append('api_key', cfg.apiKey);
    form.append('timestamp', timestamp);
    form.append('folder', opts.folder);
    form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`, { method: 'POST', body: form });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
    }
    const data = (await res.json());
    if (!data.secure_url) {
        throw new Error('Cloudinary response did not include secure_url');
    }
    return data.secure_url;
}
//# sourceMappingURL=cloudinary.js.map