import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const footerQuery = searchParams.get("footer_variant")?.toLowerCase();

  const requestHeaders = new Headers(request.headers);

  // 1. Check QA debug override
  if (footerQuery === "iran" || footerQuery === "intl") {
    requestHeaders.set("x-footer-variant", footerQuery);
    requestHeaders.set("x-user-country", footerQuery === "iran" ? "IR" : "INTL");
  } else {
    // 2. Extract country or IP from headers
    const cfCountry = request.headers.get("cf-ipcountry");
    const cfIp = request.headers.get("cf-connecting-ip");
    const realIp = request.headers.get("x-real-ip");
    const forwardedFor = request.headers.get("x-forwarded-for");

    // If Cloudflare country header is available
    if (cfCountry) {
      const isIran = cfCountry.toUpperCase() === "IR";
      requestHeaders.set("x-user-country", cfCountry.toUpperCase());
      requestHeaders.set("x-footer-variant", isIran ? "iran" : "intl");
    } else {
      // Default fallback: detect if locale is fa or default to IR in local development
      const acceptLang = request.headers.get("accept-language") || "";
      const isFa = acceptLang.includes("fa") || acceptLang.includes("IR");
      // Default to IR if requested on local or fa, else INTL
      const detectedCountry = isFa ? "IR" : "INTL";
      requestHeaders.set("x-user-country", detectedCountry);
      requestHeaders.set("x-footer-variant", detectedCountry === "IR" ? "iran" : "intl");
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, logos
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)$).*)",
  ],
};
