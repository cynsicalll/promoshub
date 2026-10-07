import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fetchAndStoreTiktokStats } from "@/lib/tikwm";

export const dynamic = "force-dynamic";

// Add a single TikTok to a promo (quick add)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;

  const body = (await req.json()) as {
    url?: string;
    title?: string;
    soundId?: string;
  };

  if (!body.url || !body.url.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const promo = await db.promo.findUnique({ where: { id } });
  if (!promo) {
    return NextResponse.json({ error: "Promo not found" }, { status: 404 });
  }

  const tiktok = await db.tikTok.create({
    data: {
      promoId: id,
      url: body.url.trim(),
      title: body.title?.trim() || null,
      soundId: body.soundId || null,
    },
  });

  // Auto-increment the sound's quantityUsed if a sound was selected
  if (body.soundId) {
    const promoSound = await db.promoSound.findFirst({
      where: { promoId: id, soundId: body.soundId },
    });
    if (promoSound) {
      await db.promoSound.update({
        where: { id: promoSound.id },
        data: { quantityUsed: { increment: 1 } },
      });
    }
  }

  // Auto-fetch stats (views, likes, cover, etc.) from tikwm — best-effort with 5 retries.
  // If tikwm is down, the TikTok still exists; user can click "Sync Stats" later.
  await fetchAndStoreTiktokStats(tiktok.id, tiktok.url);

  // Re-fetch to include the updated stats in the response
  const updated = await db.tikTok.findUnique({ where: { id: tiktok.id } });
  return NextResponse.json(updated, { status: 201 });
}
