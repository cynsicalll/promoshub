import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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

  return NextResponse.json(tiktok, { status: 201 });
}
