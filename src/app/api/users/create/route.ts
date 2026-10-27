import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { genShareToken } from "@/lib/format";

export const dynamic = "force-dynamic";

// POST /api/users/create — create a new user (admin only)
// Body: { username, password, role, displayName }
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, role, displayName } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    // Update existing user
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: hashPassword(password),
        role: role || "COLLABORATOR",
        displayName: displayName || null,
        shareToken: existing.shareToken || genShareToken(),
      },
    });
    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      role: updated.role,
      displayName: updated.displayName,
      shareToken: updated.shareToken,
    });
  }

  // Create new user
  const user = await db.user.create({
    data: {
      username,
      passwordHash: hashPassword(password),
      role: role || "COLLABORATOR",
      displayName: displayName || null,
      shareToken: genShareToken(),
    },
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    shareToken: user.shareToken,
  }, { status: 201 });
}
