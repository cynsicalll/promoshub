import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CustomerInput } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: { promos: { include: { payments: true } } },
  });
  if (!customer) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  const data = (await req.json()) as CustomerInput;
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "Kundenname ist erforderlich" }, { status: 400 });
  }
  const customer = await db.customer.update({
    where: { id },
    data: {
      name: data.name.trim(),
      company: data.company || null,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
    },
    include: { _count: { select: { promos: true } } },
  });
  return NextResponse.json(customer);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const { id } = await params;
  await db.customer.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
