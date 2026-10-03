import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Sync stats for all TikToks (admin only)
// Fetches play/like/comment/share counts from tikwm.com and stores them
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tiktoks = await db.tikTok.findMany({ select: { id: true, url: true } });

  let updated = 0;
  let failed = 0;

  for (const tt of tiktoks) {
    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(tt.url)}`;
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        failed++;
        continue;
      }
      const data = await res.json();
      if (data.code !== 0 || !data.data) {
        failed++;
        continue;
      }

      await db.tikTok.update({
        where: { id: tt.id },
        data: {
          playCount: data.data.play_count ?? null,
          likeCount: data.data.digg_count ?? null,
          commentCount: data.data.comment_count ?? null,
          shareCount: data.data.share_count ?? null,
          statsSynced: new Date(),
        },
      });
      updated++;

      // Small delay to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ updated, failed, total: tiktoks.length });
}

// GET: Return aggregated stats for all TikToks (admin only)
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tiktoks = await db.tikTok.findMany({
    include: {
      promo: { select: { id: true, name: true, date: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withStats = tiktoks.filter((t) => t.playCount !== null);
  const totalViews = withStats.reduce((s, t) => s + (t.playCount || 0), 0);
  const totalLikes = withStats.reduce((s, t) => s + (t.likeCount || 0), 0);
  const totalComments = withStats.reduce((s, t) => s + (t.commentCount || 0), 0);
  const totalShares = withStats.reduce((s, t) => s + (t.shareCount || 0), 0);
  const avgViews = withStats.length > 0 ? Math.round(totalViews / withStats.length) : 0;
  const avgLikes = withStats.length > 0 ? Math.round(totalLikes / withStats.length) : 0;

  // Best performing videos
  const sorted = [...withStats].sort(
    (a, b) => (b.playCount || 0) - (a.playCount || 0)
  );
  const topVideos = sorted.slice(0, 10).map((t) => ({
    id: t.id,
    url: t.url,
    title: t.title,
    playCount: t.playCount,
    likeCount: t.likeCount,
    commentCount: t.commentCount,
    shareCount: t.shareCount,
    promoName: t.promo.name,
    createdAt: t.createdAt.toISOString(),
  }));

  // Per-promo breakdown
  const promoMap = new Map<
    string,
    {
      promoId: string;
      promoName: string;
      videoCount: number;
      totalViews: number;
      totalLikes: number;
      avgViews: number;
    }
  >();

  for (const t of tiktoks) {
    const key = t.promo.id;
    if (!promoMap.has(key)) {
      promoMap.set(key, {
        promoId: t.promo.id,
        promoName: t.promo.name,
        videoCount: 0,
        totalViews: 0,
        totalLikes: 0,
        avgViews: 0,
      });
    }
    const entry = promoMap.get(key)!;
    entry.videoCount++;
    if (t.playCount !== null) {
      entry.totalViews += t.playCount;
      entry.totalLikes += t.likeCount || 0;
    }
  }

  const promoBreakdown = Array.from(promoMap.values())
    .map((p) => ({
      ...p,
      avgViews: p.videoCount > 0 ? Math.round(p.totalViews / p.videoCount) : 0,
    }))
    .sort((a, b) => b.totalViews - a.totalViews);

  return NextResponse.json({
    totalVideos: tiktoks.length,
    videosWithStats: withStats.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    avgViews,
    avgLikes,
    topVideos,
    promoBreakdown,
    lastSynced: withStats.length > 0 ? withStats[0].statsSynced?.toISOString() : null,
  });
}
