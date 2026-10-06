import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fetchAndStoreTiktokStatsBatch } from "@/lib/tikwm";

export const dynamic = "force-dynamic";

// POST: Sync stats for all TikToks (admin only)
// Fetches play/like/comment/share counts from tikwm.com and stores them.
// Uses the shared helper with retry logic (3 attempts per video with backoff).
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tiktoks = await db.tikTok.findMany({ select: { id: true, url: true } });

  const { updated, failed } = await fetchAndStoreTiktokStatsBatch(tiktoks);

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
    promoName: t.promo?.name || null,
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
    if (!t.promo) continue;
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
