import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: (string | number | null | undefined)[][], headers: string[]): string {
  const lines = [headers.map(csvEscape).join(";")];
  for (const row of rows) lines.push(row.map(csvEscape).join(";"));
  // BOM for Excel
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const type = req.nextUrl.searchParams.get("type") || "promos";
  const fmt = req.nextUrl.searchParams.get("format") || "csv";

  let filename = "export.csv";
  let csv = "";

  if (type === "promos") {
    const promos = await db.promo.findMany({
      include: { customer: true, sounds: { include: { sound: true } }, payments: true },
      orderBy: { date: "desc" },
    });
    const rows = promos.map((p) => {
      const total = p.payments.reduce((s, x) => s + x.amount, 0);
      const used = p.sounds.reduce((s, x) => s + x.quantityUsed, 0);
      const qtotal = p.sounds.reduce((s, x) => s + x.quantityTotal, 0);
      return [
        p.name,
        p.customer?.name || "",
        p.customer?.company || "",
        format(new Date(p.date), "dd.MM.yyyy"),
        p.status,
        p.sounds.map((s) => s.sound.name).join(", "),
        qtotal,
        used,
        qtotal - used,
        total.toFixed(2).replace(".", ","),
        p.notes || "",
      ];
    });
    csv = toCsv(
      rows,
      [
        "Promo",
        "Kunde",
        "Firma",
        "Datum",
        "Status",
        "Sounds",
        "Sounds insgesamt",
        "Sounds verwendet",
        "Sounds übrig",
        "Vergütung",
        "Notizen",
      ]
    );
    filename = "promos.csv";
  } else if (type === "payments") {
    const payments = await db.payment.findMany({
      include: { promo: { include: { customer: true } } },
      orderBy: { expectedDate: "asc" },
    });
    const rows = payments.map((p) => [
      p.promo?.name || "",
      p.promo?.customer?.name || "",
      p.amount.toFixed(2).replace(".", ","),
      p.expectedDate ? format(new Date(p.expectedDate), "dd.MM.yyyy") : "",
      p.payoutDate ? format(new Date(p.payoutDate), "dd.MM.yyyy") : "",
      p.receivedDate ? format(new Date(p.receivedDate), "dd.MM.yyyy") : "",
      p.paidOut ? "Ja" : "Nein",
      p.received ? "Ja" : "Nein",
      p.notes || "",
    ]);
    csv = toCsv(rows, [
      "Promo",
      "Kunde",
      "Betrag",
      "Erwartetes Datum",
      "Ausgezahlt am",
      "Eingangsdatum",
      "Ausgezahlt",
      "Angekommen",
      "Notizen",
    ]);
    filename = "zahlungen.csv";
  } else if (type === "customers") {
    const customers = await db.customer.findMany({
      include: { _count: { select: { promos: true } } },
      orderBy: { name: "asc" },
    });
    const rows = customers.map((c) => [
      c.name,
      c.company || "",
      c.contactPerson || "",
      c.email || "",
      c.phone || "",
      c._count.promos,
      c.notes || "",
    ]);
    csv = toCsv(rows, ["Name", "Firma", "Ansprechpartner", "E-Mail", "Telefon", "Promos", "Notizen"]);
    filename = "kunden.csv";
  } else if (type === "sounds") {
    const sounds = await db.sound.findMany({
      include: { _count: { select: { promoSounds: true } } },
      orderBy: { name: "asc" },
    });
    const rows = sounds.map((s) => [
      s.name,
      s.artist || "",
      s.internalRef || "",
      s.url || "",
      s._count.promoSounds,
      s.notes || "",
    ]);
    csv = toCsv(rows, ["Name", "Artist", "Interne Bezeichnung", "Link", "Verwendungen", "Notizen"]);
    filename = "sounds.csv";
  }

  if (fmt === "excel" || fmt === "xlsx") {
    // For Excel we return the CSV with Excel-friendly sep hint; the .csv with BOM opens natively.
    filename = filename.replace(/\.csv$/, ".csv");
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
