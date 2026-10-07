import { db } from "@/lib/db";

// Fetch TikTok video stats from tikwm.com API for a single URL.
// Returns the raw stats data, or null if the fetch fails.
// Retries up to maxRetries times with backoff (tikwm is often flaky/rate-limited).
async function fetchTiktokData(
  url: string,
  maxRetries = 5
): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return null;
      }
      const data = await res.json();
      if (data.code !== 0 || !data.data) {
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return null;
      }
      return data.data as Record<string, unknown>;
    } catch {
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

// Fetch TikTok video stats (views, likes, comments, shares, cover, duration, createTime)
// from tikwm.com and store them in the database for the given TikTok record ID.
//
// Uses 5 retries with backoff (1s, 2s, 3s, 4s, 5s) because tikwm is very flaky.
// If all retries fail, the TikTok record remains valid (just without stats) and
// can be synced later via the "Sync Stats" button.
//
// Returns true if stats were successfully fetched, false otherwise.
export async function fetchAndStoreTiktokStats(
  tiktokId: string,
  url: string
): Promise<boolean> {
  const data = await fetchTiktokData(url);
  if (!data) return false;

  try {
    await db.tikTok.update({
      where: { id: tiktokId },
      data: {
        title: (data.title as string) || undefined,
        cover: (data.cover as string) || (data.origin_cover as string) || undefined,
        duration: (data.duration as number) || undefined,
        playCount: (data.play_count as number) ?? undefined,
        likeCount: (data.digg_count as number) ?? undefined,
        commentCount: (data.comment_count as number) ?? undefined,
        shareCount: (data.share_count as number) ?? undefined,
        createTime: (data.create_time as number) ?? undefined,
        statsSynced: new Date(),
      },
    });
    return true;
  } catch {
    return false;
  }
}

// Fetch stats for multiple TikToks in parallel (batches of 3 to stay within
// Vercel's 10s function timeout). Each TikTok gets its own retry logic.
// Uses fewer retries (3) in batch mode to avoid timeout.
// Returns the number of successful and failed fetches.
export async function fetchAndStoreTiktokStatsBatch(
  tiktoks: Array<{ id: string; url: string }>
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;
  const batchSize = 3;

  for (let i = 0; i < tiktoks.length; i += batchSize) {
    const batch = tiktoks.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (tt) => {
        // In batch mode, use 3 retries (to stay within Vercel's 10s timeout)
        const data = await fetchTiktokData(tt.url, 3);
        if (!data) return false;
        try {
          await db.tikTok.update({
            where: { id: tt.id },
            data: {
              title: (data.title as string) || undefined,
              cover: (data.cover as string) || (data.origin_cover as string) || undefined,
              duration: (data.duration as number) || undefined,
              playCount: (data.play_count as number) ?? undefined,
              likeCount: (data.digg_count as number) ?? undefined,
              commentCount: (data.comment_count as number) ?? undefined,
              shareCount: (data.share_count as number) ?? undefined,
              createTime: (data.create_time as number) ?? undefined,
              statsSynced: new Date(),
            },
          });
          return true;
        } catch {
          return false;
        }
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) updated++;
      else failed++;
    }
  }

  return { updated, failed };
}
