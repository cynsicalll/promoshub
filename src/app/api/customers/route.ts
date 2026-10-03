import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CustomerInput } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const customers = await db.customer.findMany({
    include: { _count: { select: { promos: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const data = (await req.json()) as CustomerInput;
  if (!data.name || !data.name.trim()) {
    return NextResponse.json({ error: "Kundenname ist erforderlich" }, { status: 400 });
  }
  const customer = await db.customer.create({
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
  return NextResponse.json(customer, { status: 201 });
}
