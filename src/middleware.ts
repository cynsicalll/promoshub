import { NextRequest, NextResponse } from "next/server";

// Public API routes (no auth needed)
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/share/",
  "/api/customer-link/",
  "/api/tiktok-resolve",
];

// Admin API routes that require admin role
const ADMIN_API_PREFIXES = [
  "/api/promos",
  "/api/customers",
  "/api/sounds",
  "/api/payments",
  "/api/dashboard",
  "/api/monthly",
  "/api/search",
  "/api/import",
  "/api/export",
  "/api/seed",
  "/api/users",
  "/api/notes",
];

const SESSION_COOKIE = "promohub_session";

// Lightweight edge-level check: only verifies the cookie exists and has
// the expected format (data.signature). Full HMAC verification happens
// in the API routes via verifySession(). This is a defense-in-depth layer.
function hasSessionCookie(req: NextRequest): boolean {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  return cookie.includes(".") && cookie.length > 20;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // For admin API routes, check that a session cookie exists
  // (Full role verification happens in the route handler via requireAdmin)
  if (
    pathname.startsWith("/api/") &&
    ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    if (!hasSessionCookie(req)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // For /api/my-promos, /api/demo-data, require any logged-in user
  if (pathname === "/api/my-promos" || pathname === "/api/demo-data") {
    if (!hasSessionCookie(req)) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // /api/viewer-data: allow with session cookie OR with ?token= param (for viewer/collaborator access links)
  if (pathname === "/api/viewer-data") {
    if (!hasSessionCookie(req) && !req.nextUrl.searchParams.get("token")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // /api/payment-approvals and /api/push: allow without session (handles auth internally)
  if (pathname.startsWith("/api/payment-approvals") || pathname.startsWith("/api/push/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
