import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Normalize a header name to a canonical key
function norm(s: string): string {
  return s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_\-]+/g, "")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

function pick(row: Record<string, string>, ...keys: string[]): string | undefined {
  const map: Record<string, string> = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  for (const k of keys) {
    const nk = norm(k);
    if (map[nk] != null && map[nk] !== "") return map[nk];
  }
  return undefined;
}

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const cleaned = v
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseDate(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.trim();
  // dd.MM.yyyy or dd/MM/yyyy
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    const dt = new Date(`${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00`);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  // yyyy-MM-dd
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const dt = new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}T00:00:00`);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin-Rechte erforderlich" }, { status: 403 });
  }
  const type = req.nextUrl.searchParams.get("type") || "promos";
  const body = (await req.json()) as { rows: Record<string, string>[] };
  const rows = body.rows || [];

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  if (type === "promos") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = pick(r, "promo", "promoname", "name", "kampagne", "namepromo");
      if (!name) {
        skipped++;
        errors.push(`Zeile ${i + 2}: Kein Promo-Name erkannt`);
        continue;
      }
      const customerName = pick(r, "kunde", "customer", "kundenname", "firma", "company", "ansprechpartner");
      let customerId: string | null = null;
      if (customerName) {
        const existing = await db.customer.findFirst({ where: { name: { equals: customerName } } });
        if (existing) customerId = existing.id;
        else {
          const c = await db.customer.create({
            data: { name: customerName, company: pick(r, "firma", "company") || null },
          });
          customerId = c.id;
        }
      }
      const dateStr = parseDate(pick(r, "datum", "date", "promodatum")) || new Date().toISOString();
      const statusRaw = (pick(r, "status") || "GEPLANT").toString().toUpperCase();
      const status = ["GEPLANT", "AKTIV", "ABGESCHLOSSEN", "STORNIERT"].includes(statusRaw)
        ? statusRaw
        : "GEPLANT";
      const amount = parseNum(pick(r, "preis", "vergütung", "betrag", "amount", "preis€", "verguetung"));
      const notes = pick(r, "notizen", "notes", "notiz");

      const soundName = pick(r, "sound", "soundname", "track");
      const qtyTotal = parseNum(pick(r, "soundsinsgesamt", "anzahl", "quantitytotal", "sounds", "anzahlsounds"));

      let soundId: string | null = null;
      if (soundName) {
        let sound = await db.sound.findFirst({ where: { name: soundName } });
        if (!sound) sound = await db.sound.create({ data: { name: soundName } });
        soundId = sound.id;
      }

      await db.promo.create({
        data: {
          name,
          customerId,
          date: new Date(dateStr),
          status: status as never,
          notes: notes || null,
          sounds: soundId
            ? {
                create: [
                  {
                    soundId,
                    quantityTotal: qtyTotal || 0,
                    quantityUsed: 0,
                  },
                ],
              }
            : undefined,
          payments: amount > 0 ? { create: [{ amount, notes: "Importiert" }] } : undefined,
        },
      });
      imported++;
    }
  } else if (type === "payments") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const promoName = pick(r, "promo", "promoname", "name");
      if (!promoName) {
        skipped++;
        errors.push(`Zeile ${i + 2}: Kein Promo-Name erkannt`);
        continue;
      }
      const promo = await db.promo.findFirst({ where: { name: { equals: promoName } } });
      if (!promo) {
        skipped++;
        errors.push(`Zeile ${i + 2}: Promo "${promoName}" nicht gefunden`);
        continue;
      }
      const amount = parseNum(pick(r, "betrag", "amount", "preis", "vergütung"));
      const expectedDate = parseDate(pick(r, "erwartet", "erwartetesdatum", "zahlungsdatum", "expecteddate", "datum"));
      const paidOut = /ja|true|1|x|y|yes/i.test(pick(r, "ausgezahlt", "paidout") || "");
      const received = /ja|true|1|x|y|yes/i.test(pick(r, "angekommen", "received") || "");
      const receivedDate = parseDate(pick(r, "eingangsdatum", "receiveddate", "tatsächlich"));
      const payoutDate = parseDate(pick(r, "auszahlungsdatum", "payoutdate"));
      const notes = pick(r, "notizen", "notes");

      await db.payment.create({
        data: {
          promoId: promo.id,
          amount,
          expectedDate,
          payoutDate,
          receivedDate,
          paidOut,
          received,
          notes: notes || null,
        },
      });
      imported++;
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
