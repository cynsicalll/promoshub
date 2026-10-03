import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SoundInput } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  const sound = await db.sound.findUnique({
    where: { id },
    include: { promoSounds: { include: { promo: true } } },
  });
  if (!sound) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(sound);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  const data = (await req.json()) as SoundInput;
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "Soundname ist erforderlich" }, { status: 400 });
  }
  const sound = await db.sound.update({
    where: { id },
    data: {
      name: data.name.trim(),
      artist: data.artist || null,
      internalRef: data.internalRef || null,
      url: data.url || null,
      notes: data.notes || null,
    },
    include: { _count: { select: { promoSounds: true } } },
  });
  return NextResponse.json(sound);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  await db.sound.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
