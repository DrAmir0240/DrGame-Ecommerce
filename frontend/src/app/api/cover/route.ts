import { NextRequest, NextResponse } from "next/server";

const WHITELISTED_DOMAINS = [
  "image.api.playstation.com",
  "gmedia.playstation.com",
  "shared.akamai.steamstatic.com",
  "cdn.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "cdn2.steamgriddb.com",
  "images.igdb.com",
  "media.rawg.io",
  "upload.wikimedia.org",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Enforce domain whitelist security rule
    const isWhitelisted = WHITELISTED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isWhitelisted) {
      return NextResponse.json(
        { error: "Domain not allowed by DrGame media whitelist" },
        { status: 403 }
      );
    }

    // Fetch upstream image
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "DrGame-Image-Proxy/1.0",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: 2592000 }, // 30 days cache
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream returned status ${upstreamRes.status}` },
        { status: upstreamRes.status }
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await upstreamRes.arrayBuffer();

    // Return with long-term cache headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000, immutable",
        "X-DrGame-Proxy": "HIT",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to proxy image", details: error?.message },
      { status: 500 }
    );
  }
}
