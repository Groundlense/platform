import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:3000/api/v1";

/**
 * Authenticated media proxy.
 *
 * The NestJS backend serves file bytes at GET /api/v1/media/:id/file behind a
 * JWT guard that only reads the Bearer Authorization header
 * (ExtractJwt.fromAuthHeaderAsBearerToken), so a plain <img> tag cannot
 * authenticate — the access token lives in an httpOnly cookie. This handler
 * reads the session cookie server-side, forwards the request with the Bearer
 * token, and streams the file back. Use /api/media/:id as the <img> src.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Forward Range requests so <video> playback can seek without downloading
  // the whole file (the backend's res.sendFile supports byte ranges).
  const range = req.headers.get("range");

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/media/${encodeURIComponent(id)}/file`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(range ? { Range: range } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return new NextResponse("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Not found", { status: upstream.status || 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "Cache-Control": "private, max-age=300",
  };
  for (const h of ["content-range", "accept-ranges", "content-length"]) {
    const v = upstream.headers.get(h);
    if (v) headers[h] = v;
  }

  // 206 Partial Content passes through unchanged for range requests.
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
