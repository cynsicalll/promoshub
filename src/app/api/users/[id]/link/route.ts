import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { genShareToken } from "@/lib/format";

export const dynamic = "force-dynamic";

// Generate or regenerate the direct-access token for a customer user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (user.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "Nur Kunden-Zugänge können einen Link erhalten" },
      { status: 400 }
    );
  }

  // Generate a unique token
  let token = genShareToken();
  let attempts = 0;
  while (attempts < 10) {
    const clash = await db.user.findFirst({
      where: { shareToken: token, NOT: { id } },
    });
    if (!clash) break;
    token = genShareToken();
    attempts++;
  }

  await db.user.update({
    where: { id },
    data: { shareToken: token },
  });

  const shareUrl = `/c/${token}`;
  return NextResponse.json({ shareToken: token, shareUrl });
}

// Remove the direct-access token (revoke the link)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;

  await db.user.update({
    where: { id },
    data: { shareToken: null },
  });

  return new NextResponse(null, { status: 204 });
}
