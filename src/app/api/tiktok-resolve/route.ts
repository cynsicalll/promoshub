import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache: url -> { videoId, cover, title, playCount, ..., fetchedAt }
interface CacheEntry {
  videoId: string | null;
  cover: string | null;
  title: string | null;
  playCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  fetchedAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for stats (shorter than thumbnail)

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

// Fetch video data from tikwm.com API (with retry)
async function fetchVideoData(
  url: string
): Promise<Omit<CacheEntry, "fetchedAt" | "videoId">> {
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
        playCount: data.data.play_count ?? null,
        likeCount: data.data.digg_count ?? null,
        commentCount: data.data.comment_count ?? null,
        shareCount: data.data.share_count ?? null,
      };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return {
    cover: null,
    title: null,
    playCount: null,
    likeCount: null,
    commentCount: null,
    shareCount: null,
  };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached);
  }

  // Try direct extraction first (fast path)
  let videoId = extractVideoId(url);

  // For short URLs, resolve server-side
  if (!videoId && url.includes("tiktok.com")) {
    videoId = await resolveShortUrl(url);
  }

  // Fetch video data (thumbnail + stats)
  const videoData = await fetchVideoData(url);

  const entry: CacheEntry = {
    ...videoData,
    videoId,
    fetchedAt: Date.now(),
  };
  cache.set(url, entry);

  return NextResponse.json(entry);
}
