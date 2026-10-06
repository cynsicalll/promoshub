import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PromoInput } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";
import { fetchAndStoreTiktokStatsBatch } from "@/lib/tikwm";

export const dynamic = "force-dynamic";

function promoInclude() {
  return {
    customer: true,
    sounds: { include: { sound: true } },
    payments: { orderBy: { createdAt: "asc" } },
    tiktoks: { orderBy: { createdAt: "desc" } },
  } as const;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const promos = await db.promo.findMany({
    include: promoInclude(),
    orderBy: { date: "desc" },
  });
  return NextResponse.json(promos);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const data = (await req.json()) as PromoInput;

  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "Promo-Name ist erforderlich" }, { status: 400 });
  }
  if (!data.date) {
    return NextResponse.json({ error: "Datum ist erforderlich" }, { status: 400 });
  }

  const promo = await db.promo.create({
    data: {
      name: data.name.trim(),
      customerId: data.customerId || null,
      date: new Date(data.date),
      status: data.status || "GEPLANT",
      notes: data.notes || null,
      tiktokTarget: Number(data.tiktokTarget) || 0,
      sounds: data.sounds?.length
        ? {
            create: data.sounds.map((s) => ({
              soundId: s.soundId,
              quantityTotal: Number(s.quantityTotal) || 0,
              quantityUsed: Number(s.quantityUsed) || 0,
            })),
          }
        : undefined,
      payments: data.payments?.length
        ? {
            create: data.payments.map((p) => ({
              amount: Number(p.amount) || 0,
              expectedDate: p.expectedDate ? new Date(p.expectedDate) : null,
              payoutDate: p.payoutDate ? new Date(p.payoutDate) : null,
              receivedDate: p.receivedDate ? new Date(p.receivedDate) : null,
              paidOut: !!p.paidOut,
              received: !!p.received,
              notes: p.notes || null,
            })),
          }
        : undefined,
      tiktoks: data.tiktoks?.filter((t) => t.url.trim()).length
        ? {
            create: data.tiktoks
              .filter((t) => t.url.trim())
              .map((t) => ({
                url: t.url.trim(),
                title: t.title || null,
                soundId: t.soundId || null,
              })),
          }
        : undefined,
    },
    include: promoInclude(),
  });

  // Auto-increment quantityUsed for each new TikTok that has a sound linked.
  // The PromoSound records were just created in the same db.promo.create call,
  // so we can match them by soundId.
  for (const t of (data.tiktoks || []).filter((t) => t.url.trim() && t.soundId)) {
    const ps = promo.sounds?.find((s) => s.soundId === t.soundId);
    if (ps) {
      await db.promoSound.update({
        where: { id: ps.id },
        data: { quantityUsed: { increment: 1 } },
      });
    }
  }

  // Auto-fetch stats (views, likes, cover, etc.) from tikwm for all new TikToks.
  // Best-effort: if tikwm is down, the TikToks still exist — user can click "Sync Stats" later.
  if (promo.tiktoks?.length) {
    await fetchAndStoreTiktokStatsBatch(
      promo.tiktoks.map((t) => ({ id: t.id, url: t.url }))
    );
    // Re-fetch the promo to include the updated stats in the response
    const updated = await db.promo.findUnique({
      where: { id: promo.id },
      include: promoInclude(),
    });
    return NextResponse.json(updated, { status: 201 });
  }

  return NextResponse.json(promo, { status: 201 });
}
