import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { genShareCode } from "@/lib/format";

export const dynamic = "force-dynamic";

function promoInclude() {
  return {
    customer: true,
    sounds: { include: { sound: true } },
    payments: { orderBy: { createdAt: "asc" } },
    tiktoks: { orderBy: { createdAt: "desc" } },
  } as const;
}

// Enable sharing + (re)generate code
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const promo = await db.promo.findUnique({ where: { id } });
  if (!promo) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Generate a unique code
  let code = genShareCode();
  let attempts = 0;
  while (attempts < 10) {
    const clash = await db.promo.findFirst({ where: { shareCode: code, NOT: { id } } });
    if (!clash) break;
    code = genShareCode();
    attempts++;
  }

  await db.promo.update({
    where: { id },
    data: { shareEnabled: true, shareCode: code },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || "";
  const shareUrl = origin
    ? `${origin}/?share=${code}`
    : `/?share=${code}`;

  return NextResponse.json({ shareCode: code, shareUrl });
}

// Disable sharing (keeps code for re-enabling but hides the page)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.promo.update({
    where: { id },
    data: { shareEnabled: false },
  });
  return new NextResponse(null, { status: 204 });
}
