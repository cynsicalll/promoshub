import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ promos: [], customers: [], sounds: [] });
  }
  const [promos, customers, sounds] = await Promise.all([
    db.promo.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { notes: { contains: q } },
          { customer: { name: { contains: q } } },
          { customer: { company: { contains: q } } },
          { sounds: { some: { sound: { name: { contains: q } } } } },
        ],
      },
      include: {
        customer: true,
        sounds: { include: { sound: true } },
        payments: true,
      },
      take: 20,
    }),
    db.customer.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { company: { contains: q } },
          { contactPerson: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 10,
    }),
    db.sound.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { artist: { contains: q } },
          { internalRef: { contains: q } },
        ],
      },
      take: 10,
    }),
  ]);
  return NextResponse.json({ promos, customers, sounds });
}
