import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache: url -> { videoId, cover, title, fetchedAt }
const cache = new Map<
  string,
  { videoId: string | null; cover: string | null; title: string | null; fetchedAt: number }
>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Extract video ID directly from URL
function extractVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  if (m) return m[1];
  return null;
}

// Resolve a TikTok short URL by following redirects server-side
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

    if (location) {
      const id = extractVideoId(location);
      if (id) return id;
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch thumbnail from tikwm.com API (with retry)
async function fetchThumbnail(
  url: string
): Promise<{ cover: string | null; title: string | null }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      const data = await res.json();
      if (data.code !== 0 || !data.data) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return {
        cover: data.data.cover || data.data.origin_cover || null,
        title: data.data.title || null,
      };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return { cover: null, title: null };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json({
      videoId: cached.videoId,
      cover: cached.cover,
      title: cached.title,
    });
  }

  // Try direct extraction first (fast path)
  let videoId = extractVideoId(url);

  // For short URLs, resolve server-side
  if (!videoId && url.includes("tiktok.com")) {
    videoId = await resolveShortUrl(url);
  }

  // Fetch thumbnail from tikwm.com
  const { cover, title } = await fetchThumbnail(url);

  cache.set(url, { videoId, cover, title, fetchedAt: Date.now() });

  return NextResponse.json({ videoId, cover, title });
}
