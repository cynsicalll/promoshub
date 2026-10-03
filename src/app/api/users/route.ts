import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: { role: { in: ["CUSTOMER", "VIEWER"] } },
    include: {
      promoAccess: {
        include: {
          promo: { select: { id: true, name: true, date: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }

  const { username, password, displayName, promoIds, role } = (await req.json()) as {
    username?: string;
    password?: string;
    displayName?: string;
    promoIds?: string[];
    role?: string;
  };

  if (!username || !username.trim()) {
    return NextResponse.json({ error: "Benutzername erforderlich" }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 4 Zeichen lang sein" },
      { status: 400 }
    );
  }

  const normalizedUsername = username.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { username: normalizedUsername } });
  if (existing) {
    return NextResponse.json({ error: "Benutzername bereits vergeben" }, { status: 400 });
  }

  const user = await db.user.create({
    data: {
      username: normalizedUsername,
      passwordHash: hashPassword(password),
      role: role === "VIEWER" ? "VIEWER" : "CUSTOMER",
      displayName: displayName?.trim() || null,
      promoAccess: promoIds?.length
        ? {
            create: promoIds.map((promoId) => ({ promoId })),
          }
        : undefined,
    },
    include: {
      promoAccess: {
        include: {
          promo: { select: { id: true, name: true, date: true, status: true } },
        },
      },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
