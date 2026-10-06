import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/backup — download a full JSON backup of all data
// Returns a JSON file with all promos, customers, sounds, payments, tiktoks, users, settings
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Fetch all data with relations
  const [promos, customers, sounds, tiktoks, users] = await Promise.all([
    db.promo.findMany({
      include: {
        customer: true,
        sounds: { include: { sound: true } },
        payments: { orderBy: { createdAt: "asc" } },
        tiktoks: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { date: "desc" },
    }),
    db.customer.findMany({ orderBy: { createdAt: "desc" } }),
    db.sound.findMany({ orderBy: { createdAt: "desc" } }),
    db.tikTok.findMany({
      include: { promo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        displayName: true,
        shareToken: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash for security
      },
    }),
  ]);

  const backup = {
    _meta: {
      exportedAt: new Date().toISOString(),
      version: 1,
      app: "Promos – Sound Promo Manager",
      counts: {
        promos: promos.length,
        customers: customers.length,
        sounds: sounds.length,
        tiktoks: tiktoks.length,
        users: users.length,
      },
    },
    promos,
    customers,
    sounds,
    tiktoks,
    users,
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `promos-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
