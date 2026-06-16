import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:3000/api/v1";

/**
 * Authenticated borehole export proxy.
 *
 * GET /api/v1/boreholes/:id/export?format=json|csv (REPORT_VIEW) returns a
 * file download with a Content-Disposition header, but the JWT guard only
 * reads the Bearer Authorization header — a plain <a href> cannot
 * authenticate since the access token lives in an httpOnly cookie. This
 * handler reads the session cookie server-side, forwards the request with
 * the Bearer token, and streams the file back preserving the download
 * headers. Use /api/boreholes/:id/export?format=csv as the link target.
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

  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  let upstream: Response;
  try {
    upstream = await fetch(
      `${API_BASE}/boreholes/${encodeURIComponent(id)}/export?format=${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return new NextResponse("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Export failed", { status: upstream.status || 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type":
      upstream.headers.get("content-type") ??
      (format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8"),
    "Content-Disposition":
      upstream.headers.get("content-disposition") ??
      `attachment; filename="borehole-${id}.${format}"`,
    "Cache-Control": "no-store",
  };

  return new NextResponse(upstream.body, { status: 200, headers });
}
