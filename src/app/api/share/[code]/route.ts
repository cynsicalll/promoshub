import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ShareData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const promo = await db.promo.findFirst({
    where: { shareCode: code, shareEnabled: true },
    include: {
      customer: true,
      sounds: { include: { sound: true } },
      tiktoks: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!promo) {
    return NextResponse.json(
      { error: "Ungültiger Code oder Freigabe deaktiviert." },
      { status: 404 }
    );
  }

  const data: ShareData = {
    name: promo.name,
    customerName: promo.customer?.name || null,
    customerCompany: promo.customer?.company || null,
    date: promo.date.toISOString(),
    status: promo.status as ShareData["status"],
    notes: promo.notes || null,
    tiktokTarget: promo.tiktokTarget || 0,
    tiktokDone: promo.tiktoks.length,
    sounds: promo.sounds.map((ps) => ({
      name: ps.sound.name,
      artist: ps.sound.artist,
      url: ps.sound.url,
      quantityTotal: ps.quantityTotal,
      quantityUsed: ps.quantityUsed,
      quantityRemaining: ps.quantityTotal - ps.quantityUsed,
    })),
    tiktoks: promo.tiktoks.map((t) => ({
      url: t.url,
      title: t.title,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(data);
}
