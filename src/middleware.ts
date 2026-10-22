import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authOnlyRedirects = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const appProtectedPrefixes = [
  "/dashboard",
  "/pos",
  "/orders",
  "/kitchen",
  "/products",
  "/categories",
  "/deals",
  "/tables",
  "/customers",
  "/reports",
  "/pricing",
  "/activity",
  "/settings",
  "/whatsapp",
  "/onboarding",
];

const publicApiPrefixes = [
  "/api/health",
  "/api/auth",
  "/api/whatsapp/webhook",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Production HTTPS uses the `__Secure-` cookie prefix; without this,
  // getToken misses the session and logins appear to fail after redirect.
  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isHttps,
  });

  const isPublicApi = publicApiPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (isPublicApi) return NextResponse.next();

  // Super admin panel
  if (pathname.startsWith("/super-admin")) {
    if (pathname === "/super-admin/login") {
      if (token?.isSuperAdmin) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      return NextResponse.next();
    }
    if (!token) {
      const loginUrl = new URL("/super-admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!token.isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const isAppProtected = appProtectedPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isAppProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // App users without org shouldn't hit dashboard endlessly — tenant handles it
  if (token && authOnlyRedirects.includes(pathname)) {
    if (token.isSuperAdmin && !token.organizationId) {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
