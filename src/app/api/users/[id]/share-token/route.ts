import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { genShareToken } from "@/lib/format";

export const dynamic = "force-dynamic";

// POST /api/users/[id]/share-token — generate or regenerate a shareToken for a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const shareToken = genShareToken();
  await db.user.update({
    where: { id },
    data: { shareToken },
  });

  return NextResponse.json({ shareToken });
}

// DELETE /api/users/[id]/share-token — remove shareToken
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  await db.user.update({
    where: { id },
    data: { shareToken: null },
  });

  return NextResponse.json({ success: true });
}
