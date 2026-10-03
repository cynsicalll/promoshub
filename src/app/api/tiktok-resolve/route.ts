import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache: url -> videoId (or null if unresolvable)
const cache = new Map<string, { videoId: string | null; fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Try to extract video ID directly from URL
function extractVideoId(url: string): string | null {
  // Match /video/{id} pattern (full URLs)
  const m = url.match(/\/video\/(\d+)/);
  if (m) return m[1];
  return null;
}

// Resolve a TikTok short URL (vm.tiktok.com/...) by following redirects server-side
async function resolveShortUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });

    // Follow up to 3 redirects manually
    let location = res.headers.get("location") || "";
    let count = 0;
    while (location && count < 3) {
      const id = extractVideoId(location);
      if (id) return id;
      const nextRes = await fetch(location, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });
      location = nextRes.headers.get("location") || "";
      count++;
    }

    // Final check on the last location
    if (location) {
      const id = extractVideoId(location);
      if (id) return id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // Check cache first
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ videoId: cached.videoId });
  }

  // Try direct extraction first (fast path for full URLs)
  const directId = extractVideoId(url);
  if (directId) {
    cache.set(url, { videoId: directId, fetchedAt: Date.now() });
    return NextResponse.json({ videoId: directId });
  }

  // For short URLs, resolve server-side
  const resolvedId = await resolveShortUrl(url);
  cache.set(url, { videoId: resolvedId, fetchedAt: Date.now() });
  return NextResponse.json({ videoId: resolvedId });
}
