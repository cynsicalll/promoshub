import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/promos/[id]/viewer-visible — update who can see this promo's payments
// Body: { visibleTo: "viewer" | "collaborator:<userId>" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { visibleTo } = body;

  if (!visibleTo || typeof visibleTo !== "string") {
    return NextResponse.json({ error: "visibleTo required" }, { status: 400 });
  }

  const promo = await db.promo.update({
    where: { id },
    data: { visibleTo, viewerVisible: visibleTo === "viewer" },
  });

  return NextResponse.json({ success: true, visibleTo: promo.visibleTo });
}

// GET /api/promos/[id]/viewer-visible — get current visibility + list of collaborators
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const promo = await db.promo.findUnique({ where: { id }, select: { visibleTo: true } });
  const collaborators = await db.user.findMany({
    where: { role: "COLLABORATOR" },
    select: { id: true, username: true, displayName: true },
  });

  return NextResponse.json({
    visibleTo: promo?.visibleTo || "viewer",
    collaborators,
  });
}
