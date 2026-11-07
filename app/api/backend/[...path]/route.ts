import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
const backend = serverEnv.API_INTERNAL_URL;
const safePublic =
  /^(categories(?:\/[^/]+)?|products(?:\/[^/]+)?|pages\/(home|about-us)|site-settings|contact-inquiries|quotation-requests)$/;
function saveSessions(
  response: NextResponse,
  upstream: Response,
  payload: unknown,
) {
  const secure = process.env.NODE_ENV === "production";
  const data = payload as { data?: { accessToken?: string } };
  if (data?.data?.accessToken)
    response.cookies.set("ptc_access", data.data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: 900,
    });
  for (const cookie of upstream.headers.getSetCookie()) {
    const match = cookie.match(/^cleanroom_refresh=([^;]*)/);
    if (match)
      response.cookies.set("ptc_refresh", decodeURIComponent(match[1]), {
        httpOnly: true,
        secure,
        sameSite: "strict",
        path: "/api/backend/admin/auth",
        maxAge: cookie.includes("Expires=Thu, 01 Jan 1970") ? 0 : 604800,
      });
  }
}
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  if (
    parts.some(
      (p) => p === ".." || p === "." || p.includes("/") || p.includes("\\"),
    )
  )
    return NextResponse.json(
      { error: { code: "INVALID_PATH", message: "Invalid route" } },
      { status: 400 },
    );
  const path = parts.join("/");
  if (!path.startsWith("admin/") && !safePublic.test(path))
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (
      (origin && origin !== new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return NextResponse.json(
        {
          error: { code: "INVALID_ORIGIN", message: "Invalid request origin" },
        },
        { status: 403 },
      );
  }
  const headers = new Headers({ "Content-Type": "application/json" });
  const access = request.cookies.get("ptc_access")?.value;
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const refresh = request.cookies.get("ptc_refresh")?.value;
  if (refresh && path.startsWith("admin/auth/"))
    headers.set("Cookie", `cleanroom_refresh=${encodeURIComponent(refresh)}`);
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();
  if (body && body.length > 1024 * 1024)
    return NextResponse.json(
      { error: { code: "TOO_LARGE", message: "Request is too large" } },
      { status: 413 },
    );
  try {
    const upstream = await fetch(
      `${backend}/${path}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      },
    );
    const payload = upstream.status === 204 ? null : await upstream.json();
    // Browser code never receives either backend session token.
    const cleaned =
      path.startsWith("admin/auth/") && payload?.data
        ? {
            ...payload,
            data: Object.fromEntries(
              Object.entries(payload.data).filter(
                ([key]) => key !== "accessToken" && key !== "refreshToken",
              ),
            ),
          }
        : payload;
    const response =
      upstream.status === 204
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(cleaned, { status: upstream.status });
    saveSessions(response, upstream, payload);
    if (path === "admin/auth/logout") {
      response.cookies.set("ptc_access", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
      response.cookies.set("ptc_refresh", "", {
        httpOnly: true,
        path: "/api/backend/admin/auth",
        maxAge: 0,
      });
    }
    return response;
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "The backend is unavailable. Please try again.",
        },
      },
      { status: 503 },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
