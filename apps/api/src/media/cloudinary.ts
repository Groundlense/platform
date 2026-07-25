import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

/**
 * Dependency-free Cloudinary upload via the signed REST API.
 *
 * Why: Render's disk is ephemeral — everything under ./uploads is wiped on
 * every redeploy, which silently destroyed field photos. When Cloudinary is
 * configured, uploads move there permanently and the Media row stores the
 * https URL in filePath; without config the local-disk behaviour is kept
 * (dev machines), so this is a pure opt-in via environment variables.
 *
 * Configure with either:
 *   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 * or the three separate vars:
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 */

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function getConfig(): CloudinaryConfig | null {
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

export function isCloudinaryConfigured(): boolean {
  return getConfig() !== null;
}

/** True when a Media.filePath points at remote storage rather than ./uploads. */
export function isRemoteFilePath(filePath: string): boolean {
  return /^https?:\/\//i.test(filePath);
}

/**
 * Uploads a local file and returns its permanent https URL.
 * Uses the `auto` resource type so images, videos and PDFs all work.
 * Throws on any failure — the caller decides whether local disk is an
 * acceptable fallback.
 */
export async function uploadToCloudinary(
  localPath: string,
  opts: { folder: string; fileName?: string; mimeType?: string },
): Promise<string> {
  const cfg = getConfig();
  if (!cfg) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Every parameter sent except file/api_key must be part of the signature,
  // in alphabetical order.
  const paramsToSign = `folder=${opts.folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(paramsToSign + cfg.apiSecret)
    .digest('hex');

  const bytes = await readFile(localPath);
  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(bytes)], {
      type: opts.mimeType || 'application/octet-stream',
    }),
    opts.fileName || 'upload',
  );
  form.append('api_key', cfg.apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', opts.folder);
  form.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`,
    { method: 'POST', body: form },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error('Cloudinary response did not include secure_url');
  }

  return data.secure_url;
}
