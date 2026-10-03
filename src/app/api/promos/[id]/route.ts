import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PromoInput } from "@/lib/types";

export const dynamic = "force-dynamic";

function promoInclude() {
  return {
    customer: true,
    sounds: { include: { sound: true } },
    payments: { orderBy: { createdAt: "asc" } },
    tiktoks: { orderBy: { createdAt: "desc" } },
  } as const;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promo = await db.promo.findUnique({
    where: { id },
    include: promoInclude(),
  });
  if (!promo) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(promo);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = (await req.json()) as PromoInput;

  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "Promo-Name ist erforderlich" }, { status: 400 });
  }

  const existing = await db.promo.findUnique({
    where: { id },
    include: { sounds: true, payments: true, tiktoks: true },
  });
  if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const keptPaymentIds = new Set(
    (data.payments || []).filter((p) => p.id).map((p) => p.id!)
  );
  const paymentsToDelete = existing.payments
    .filter((p) => !keptPaymentIds.has(p.id))
    .map((p) => p.id);

  // TikToks: replace entirely based on payload (each entry has id = existing to keep)
  const keptTiktokIds = new Set(
    (data.tiktoks || []).filter((t) => t.id).map((t) => t.id!)
  );
  const tiktoksToDelete = existing.tiktoks
    .filter((t) => !keptTiktokIds.has(t.id))
    .map((t) => t.id);

  await db.$transaction([
    db.promo.update({
      where: { id },
      data: {
        name: data.name.trim(),
        customerId: data.customerId || null,
        date: new Date(data.date),
        status: data.status || "GEPLANT",
        notes: data.notes || null,
        tiktokTarget: Number(data.tiktokTarget) || 0,
      },
    }),
    db.promoSound.deleteMany({ where: { promoId: id } }),
    ...(paymentsToDelete.length
      ? [db.payment.deleteMany({ where: { id: { in: paymentsToDelete } } })]
      : []),
    ...(tiktoksToDelete.length
      ? [db.tikTok.deleteMany({ where: { id: { in: tiktoksToDelete } } })]
      : []),
  ]);

  if (data.sounds?.length) {
    await db.promoSound.createMany({
      data: data.sounds.map((s) => ({
        promoId: id,
        soundId: s.soundId,
        quantityTotal: Number(s.quantityTotal) || 0,
        quantityUsed: Number(s.quantityUsed) || 0,
      })),
    });
  }

  for (const p of data.payments || []) {
    if (p.id) {
      await db.payment.update({
        where: { id: p.id },
        data: {
          amount: Number(p.amount) || 0,
          expectedDate: p.expectedDate ? new Date(p.expectedDate) : null,
          payoutDate: p.payoutDate ? new Date(p.payoutDate) : null,
          receivedDate: p.receivedDate ? new Date(p.receivedDate) : null,
          paidOut: !!p.paidOut,
          received: !!p.received,
          notes: p.notes || null,
        },
      });
    } else {
      await db.payment.create({
        data: {
          promoId: id,
          amount: Number(p.amount) || 0,
          expectedDate: p.expectedDate ? new Date(p.expectedDate) : null,
          payoutDate: p.payoutDate ? new Date(p.payoutDate) : null,
          receivedDate: p.receivedDate ? new Date(p.receivedDate) : null,
          paidOut: !!p.paidOut,
          received: !!p.received,
          notes: p.notes || null,
        },
      });
    }
  }

  // Create new TikToks (those without id)
  for (const t of (data.tiktoks || []).filter((t) => t.url.trim() && !t.id)) {
    await db.tikTok.create({
      data: {
        promoId: id,
        url: t.url.trim(),
        title: t.title || null,
        soundId: t.soundId || null,
      },
    });
  }
  // Update existing TikToks
  for (const t of (data.tiktoks || []).filter((t) => t.id && t.url.trim())) {
    await db.tikTok.update({
      where: { id: t.id },
      data: {
        url: t.url.trim(),
        title: t.title || null,
        soundId: t.soundId || null,
      },
    });
  }

  const promo = await db.promo.findUnique({
    where: { id },
    include: promoInclude(),
  });
  return NextResponse.json(promo);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.promo.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
