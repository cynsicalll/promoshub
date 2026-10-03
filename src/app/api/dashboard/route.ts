import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { DashboardData, Payment, Promo } from "@/lib/types";
import { computePaymentStatus } from "@/lib/format";
import { format, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const promos = await db.promo.findMany({
    include: {
      customer: true,
      sounds: { include: { sound: true } },
      payments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { date: "desc" },
  });

  const counts = {
    total: promos.length,
    aktiv: promos.filter((p) => p.status === "AKTIV").length,
    geplant: promos.filter((p) => p.status === "GEPLANT").length,
    abgeschlossen: promos.filter((p) => p.status === "ABGESCHLOSSEN").length,
    storniert: promos.filter((p) => p.status === "STORNIERT").length,
    openSoundsRemaining: promos
      .filter((p) => p.status !== "STORNIERT")
      .reduce(
        (s, p) =>
          s +
          p.sounds.reduce(
            (x, ps) => x + ((ps.quantityTotal || 0) - (ps.quantityUsed || 0)),
            0
          ),
        0
      ),
  };

  const allPayments = promos.flatMap((p) =>
    p.payments.map((pay) => ({ ...pay, promo: p }))
  );

  const totalEarned = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const received = allPayments
    .filter((p) => p.received)
    .reduce((s, p) => s + (p.amount || 0), 0);
  const paidOut = allPayments
    .filter((p) => p.paidOut)
    .reduce((s, p) => s + (p.amount || 0), 0);

  const money = {
    totalEarned,
    received,
    outstanding: totalEarned - received,
    paidOut,
    notPaidOut: totalEarned - paidOut,
  };

  const recentPromos = (promos as Promo[])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  const recentPayments = allPayments
    .filter((p) => p.received && p.receivedDate)
    .sort(
      (a, b) =>
        new Date(b.receivedDate!).getTime() -
        new Date(a.receivedDate!).getTime()
    )
    .slice(0, 6) as (Payment & { promo: Promo })[];

  const overduePayments = allPayments
    .filter(
      (p) =>
        !p.received &&
        computePaymentStatus(p.paidOut, p.received, p.expectedDate) ===
          "UEBERFAELLIG"
    )
    .sort(
      (a, b) =>
        new Date(a.expectedDate!).getTime() -
        new Date(b.expectedDate!).getTime()
    ) as (Payment & { promo: Promo })[];

  // Monthly: last 6 months
  const monthly: { month: string; earned: number; received: number }[] = [];
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const key = format(m, "yyyy-MM");
    const label = `${monthNames[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`;
    const earned = allPayments
      .filter((p) => p.promo && format(new Date(p.promo.date), "yyyy-MM") === key)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const rec = allPayments
      .filter(
        (p) =>
          p.receivedDate &&
          format(new Date(p.receivedDate), "yyyy-MM") === key
      )
      .reduce((s, p) => s + (p.amount || 0), 0);
    monthly.push({ month: label, earned, received: rec });
  }

  const data: DashboardData = {
    counts,
    money,
    recentPromos,
    recentPayments,
    overduePayments,
    monthly,
  };
  return NextResponse.json(data);
}
