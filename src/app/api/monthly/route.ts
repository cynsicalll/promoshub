import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { MonthlyEntry } from "@/lib/types";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const monthNames = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const promos = await db.promo.findMany({
    where: { date: { gte: start, lt: end } },
    include: {
      payments: true,
      tiktoks: true,
    },
  });

  const entries: MonthlyEntry[] = [];
  for (let m = 0; m < 12; m++) {
    const monthPromos = promos.filter(
      (p) => new Date(p.date).getMonth() === m
    );
    const earned = monthPromos.reduce(
      (s, p) => s + p.payments.reduce((x, pay) => x + pay.amount, 0),
      0
    );
    const received = monthPromos.reduce(
      (s, p) =>
        s +
        p.payments.filter((pay) => pay.received).reduce((x, pay) => x + pay.amount, 0),
      0
    );
    const tiktoks = monthPromos.reduce((s, p) => s + p.tiktoks.length, 0);
    entries.push({
      key: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: `${monthNames[m]} ${String(year).slice(2)}`,
      promos: monthPromos.length,
      earned,
      received,
      outstanding: earned - received,
      tiktoks,
    });
  }

  // Also return available years for the selector
  const allPromos = await db.promo.findMany({ select: { date: true } });
  const yearsSet = new Set<number>();
  allPromos.forEach((p) => yearsSet.add(new Date(p.date).getFullYear()));
  const years = Array.from(yearsSet).sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  return NextResponse.json({ year, years, entries });
}
