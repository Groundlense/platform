import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/session";

const API_BASE = process.env.API_URL || "http://localhost:3000/api/v1";

/**
 * Authenticated "all site photos" ZIP proxy.
 *
 * GET /api/v1/projects/:id/photos/zip (REPORT_VIEW) streams a ZIP of every
 * uploaded photo for the project, but the JWT guard only reads the Bearer
 * Authorization header — a plain <a href> cannot authenticate since the
 * access token lives in an httpOnly cookie. This handler reads the session
 * cookie server-side, forwards the request with the Bearer token, and
 * streams the archive back preserving the download headers.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const token = await getToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${API_BASE}/projects/${encodeURIComponent(projectId)}/photos/zip`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return new NextResponse("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Download failed", { status: upstream.status || 404 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/zip",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ??
        `attachment; filename="site-photos-${projectId}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
