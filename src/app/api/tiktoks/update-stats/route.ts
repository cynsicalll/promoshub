import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/tiktoks/update-stats — manually update stats for a TikTok by ID
// Body: { id, playCount, likeCount, commentCount, shareCount, cover, duration, createTime, title }
// Used as a fallback when tikwm blocks Vercel's servers
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...stats } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { statsSynced: new Date() };
  if (stats.playCount !== undefined) updateData.playCount = stats.playCount;
  if (stats.likeCount !== undefined) updateData.likeCount = stats.likeCount;
  if (stats.commentCount !== undefined) updateData.commentCount = stats.commentCount;
  if (stats.shareCount !== undefined) updateData.shareCount = stats.shareCount;
  if (stats.cover) updateData.cover = stats.cover;
  if (stats.duration) updateData.duration = stats.duration;
  if (stats.createTime) updateData.createTime = stats.createTime;
  if (stats.title) updateData.title = stats.title;

  try {
    await db.tikTok.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
