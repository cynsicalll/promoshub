import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Add a standalone TikTok video (no promo required)
// Auto-fetches stats from tikwm.com
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { url, title, soundId, promoId } = (await req.json()) as {
    url?: string;
    title?: string;
    soundId?: string;
    promoId?: string;
  };

  if (!url || !url.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const cleanUrl = url.trim();

  // Check if this URL already exists
  const existing = await db.tikTok.findFirst({ where: { url: cleanUrl } });
  if (existing) {
    return NextResponse.json({ error: "This TikTok URL already exists" }, { status: 400 });
  }

  // Create the TikTok entry
  const tiktok = await db.tikTok.create({
    data: {
      url: cleanUrl,
      title: title?.trim() || null,
      soundId: soundId || null,
      promoId: promoId || null,
    },
  });

  // Auto-fetch stats from tikwm.com
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 0 && data.data) {
        await db.tikTok.update({
          where: { id: tiktok.id },
          data: {
            title: tiktok.title || data.data.title || null,
            cover: data.data.cover || data.data.origin_cover || null,
            duration: data.data.duration || null,
            playCount: data.data.play_count ?? null,
            likeCount: data.data.digg_count ?? null,
            commentCount: data.data.comment_count ?? null,
            shareCount: data.data.share_count ?? null,
            statsSynced: new Date(),
          },
        });
      }
    }
  } catch {
    // Stats will be fetched on next sync
  }

  // Auto-increment sound usage if soundId is set and promoId is set
  if (soundId && promoId) {
    const promoSound = await db.promoSound.findFirst({
      where: { promoId, soundId },
    });
    if (promoSound) {
      await db.promoSound.update({
        where: { id: promoSound.id },
        data: { quantityUsed: { increment: 1 } },
      });
    }
  }

  const result = await db.tikTok.findUnique({ where: { id: tiktok.id } });
  return NextResponse.json(result, { status: 201 });
}

// Get all standalone TikToks (no promo) + promo-linked ones
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tiktoks = await db.tikTok.findMany({
    include: {
      promo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sounds = await db.sound.findMany({ select: { id: true, name: true, artist: true } });
  const soundMap = new Map(sounds.map((s) => [s.id, s]));

  const result = tiktoks.map((t) => {
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
      promoName: t.promo?.name || null,
      hasPromo: !!t.promoId,
      createdAt: t.createdAt.toISOString(),
      statsSynced: t.statsSynced?.toISOString() || null,
    };
  });

  return NextResponse.json(result);
}

// Delete a TikTok
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await db.tikTok.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
