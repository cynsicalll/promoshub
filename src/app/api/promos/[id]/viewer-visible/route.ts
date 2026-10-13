import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/promos/[id]/viewer-visible — toggle viewer visibility
// Body: { visible: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { visible } = body;

  if (typeof visible !== "boolean") {
    return NextResponse.json({ error: "visible (boolean) required" }, { status: 400 });
  }

  const promo = await db.promo.update({
    where: { id },
    data: { viewerVisible: visible },
  });

  return NextResponse.json({ success: true, viewerVisible: promo.viewerVisible });
}
