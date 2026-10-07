import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Return invoice settings
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    if (s.key.startsWith("invoice")) map[s.key] = s.value;
  }
  return NextResponse.json(map);
}

// PUT: Save invoice settings
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = (await req.json()) as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  return NextResponse.json({ ok: true });
}
