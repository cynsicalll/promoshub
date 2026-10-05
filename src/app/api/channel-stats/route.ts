import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tiktoks = await db.tikTok.findMany({
    include: { promo: { select: { id: true, name: true } } },
    orderBy: { playCount: "desc" },
  });

  const sounds = await db.sound.findMany({ select: { id: true, name: true, artist: true } });
  const soundMap = new Map(sounds.map((s) => [s.id, s]));
  const promos = await db.promo.findMany({ select: { id: true, name: true } });
  const promoMap = new Map(promos.map((p) => [p.id, p.name]));

  const videos = tiktoks.map((t) => {
    const sound = t.soundId ? soundMap.get(t.soundId) : null;
    return {
      id: t.id,
      url: t.url,
      title: t.title,
      cover: t.cover,
      duration: t.duration,
      playCount: t.playCount,
      likeCount: t.likeCount,
      commentCount: t.commentCount,
      shareCount: t.shareCount,
      soundName: sound?.name || null,
      soundArtist: sound?.artist || null,
      promoName: t.promo?.name || (t.promoId ? promoMap.get(t.promoId) : null) || null,
      hasPromo: !!t.promoId,
      createdAt: t.createdAt.toISOString(),
      statsSynced: t.statsSynced?.toISOString() || null,
    };
  });

  const withStats = videos.filter((v) => v.playCount !== null);
  const totalViews = withStats.reduce((s, v) => s + (v.playCount || 0), 0);
  const totalLikes = withStats.reduce((s, v) => s + (v.likeCount || 0), 0);
  const totalComments = withStats.reduce((s, v) => s + (v.commentCount || 0), 0);
  const totalShares = withStats.reduce((s, v) => s + (v.shareCount || 0), 0);
  const avgViews = withStats.length > 0 ? Math.round(totalViews / withStats.length) : 0;
  const avgLikes = withStats.length > 0 ? Math.round(totalLikes / withStats.length) : 0;

  const topVideos = [...withStats].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10);

  const soundStats = new Map<string, { soundName: string; artist: string | null; videoCount: number; totalViews: number; totalLikes: number; avgViews: number; avgEngagement: number }>();
  for (const v of withStats) {
    if (!v.soundName) continue;
    if (!soundStats.has(v.soundName)) soundStats.set(v.soundName, { soundName: v.soundName, artist: v.soundArtist, videoCount: 0, totalViews: 0, totalLikes: 0, avgViews: 0, avgEngagement: 0 });
    const s = soundStats.get(v.soundName)!;
    s.videoCount++; s.totalViews += v.playCount || 0; s.totalLikes += v.likeCount || 0;
  }
  const soundPerformance = Array.from(soundStats.values()).map((s) => ({ ...s, avgViews: s.videoCount > 0 ? Math.round(s.totalViews / s.videoCount) : 0, avgEngagement: s.totalViews > 0 ? Math.round((s.totalLikes / s.totalViews) * 1000) / 10 : 0 })).sort((a, b) => b.avgViews - a.avgViews);

  const promoStats = new Map<string, { promoName: string; videoCount: number; totalViews: number; totalLikes: number; avgViews: number }>();
  for (const v of withStats) {
    if (!v.promoName) continue;
    if (!promoStats.has(v.promoName)) promoStats.set(v.promoName, { promoName: v.promoName, videoCount: 0, totalViews: 0, totalLikes: 0, avgViews: 0 });
    const p = promoStats.get(v.promoName)!;
    p.videoCount++; p.totalViews += v.playCount || 0; p.totalLikes += v.likeCount || 0;
  }
  const promoPerformance = Array.from(promoStats.values()).map((p) => ({ ...p, avgViews: p.videoCount > 0 ? Math.round(p.totalViews / p.videoCount) : 0 })).sort((a, b) => b.totalViews - a.totalViews);

  return NextResponse.json({ totalVideos: videos.length, videosWithStats: withStats.length, totalViews, totalLikes, totalComments, totalShares, avgViews, avgLikes, topVideos, soundPerformance, promoPerformance, allVideos: videos, lastSynced: withStats.length > 0 ? withStats[0].statsSynced : null });
}
