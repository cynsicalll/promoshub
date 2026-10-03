import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }

  const { password, displayName, promoIds } = (await req.json()) as {
    password?: string;
    displayName?: string;
    promoIds?: string[];
  };

  const existing = await db.user.findUnique({
    where: { id },
    include: { promoAccess: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // Update basic fields
  const updateData: Record<string, unknown> = {};
  if (displayName !== undefined) updateData.displayName = displayName?.trim() || null;
  if (password && password.length >= 4) {
    updateData.passwordHash = hashPassword(password);
  }

  if (Object.keys(updateData).length > 0) {
    await db.user.update({ where: { id }, data: updateData });
  }

  // Update promo access: replace entirely
  if (promoIds !== undefined) {
    await db.userPromoAccess.deleteMany({ where: { userId: id } });
    if (promoIds.length > 0) {
      await db.userPromoAccess.createMany({
        data: promoIds.map((promoId) => ({ userId: id, promoId })),
      });
    }
  }

  const user = await db.user.findUnique({
    where: { id },
    include: {
      promoAccess: {
        include: {
          promo: { select: { id: true, name: true, date: true, status: true } },
        },
      },
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }

  // Prevent deleting admin users via this route
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return new NextResponse(null, { status: 204 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin-Konto kann nicht gelöscht werden" },
      { status: 400 }
    );
  }

  await db.user.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
