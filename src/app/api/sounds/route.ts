import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SoundInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const sounds = await db.sound.findMany({
    include: { _count: { select: { promoSounds: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(sounds);
}

export async function POST(req: NextRequest) {
  const data = (await req.json()) as SoundInput;
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "Soundname ist erforderlich" }, { status: 400 });
  }
  const sound = await db.sound.create({
    data: {
      name: data.name.trim(),
      artist: data.artist || null,
      internalRef: data.internalRef || null,
      notes: data.notes || null,
    },
    include: { _count: { select: { promoSounds: true } } },
  });
  return NextResponse.json(sound, { status: 201 });
}
