// Import script: reads the user's Google Sheet data and imports it into the app database.
// Run with: bun run scripts/import-sheet.ts

import { db } from "../src/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  if (s === "unbekannt") return new Date("2026-08-01T00:00:00"); // "ca august"
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00`);
  return new Date(s);
}

function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Parse a "X/Y" ratio string → { used, total }
function parseRatio(s: string): { used: number; total: number } | null {
  const m = s.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) return { used: parseInt(m[1]), total: parseInt(m[2]) };
  return null;
}

// ─── Sound cache (deduplicate by name) ────────────────────────────────────────

const soundCache = new Map<string, string>(); // name → id

async function getOrCreateSound(name: string): Promise<string> {
  const key = name.toLowerCase().trim();
  if (soundCache.has(key)) return soundCache.get(key)!;
  let sound = await db.sound.findFirst({ where: { name } });
  if (!sound) sound = await db.sound.create({ data: { name } });
  soundCache.set(key, sound.id);
  return sound.id;
}

// ─── Parsed sheet data ────────────────────────────────────────────────────────

interface ParsedPromo {
  name: string;
  date: Date;
  amount: number;
  notiz: string;
  paidOut: boolean;
  received: boolean;
  sounds: { name: string; used: number; total: number }[];
  tiktokTarget: number;
}

function parseRows(): ParsedPromo[] {
  const promos: ParsedPromo[] = [];

  // Row 1: 28.08.2026 | 20€ | Done 1/1 | Ausgezahlt Ja | Angekommen Ja
  promos.push({
    name: "28.08. Promo",
    date: parseDate("28.08.2026"),
    amount: 20.0,
    notiz: "",
    paidOut: true,
    received: true,
    sounds: [{ name: "Unbekannt", used: 1, total: 1 }],
    tiktokTarget: 0,
  });

  // Row 2: unbekannt | 20€ | Notiz: 1 ca august | Done 1/1 | Ausgezahlt "1 Ja" | Angekommen Ja
  promos.push({
    name: "Promo (ca. August)",
    date: parseDate("unbekannt"),
    amount: 20.0,
    notiz: "1 ca. August",
    paidOut: true,
    received: true,
    sounds: [{ name: "Unbekannt", used: 1, total: 1 }],
    tiktokTarget: 0,
  });

  // Row 3: 09.09.2026 | 82,48€ | Notiz: (original 100$ (95.22$)) | Done 8/8 | Ausgezahlt Ja | Angekommen Ja
  promos.push({
    name: "09.09. Promo",
    date: parseDate("09.09.2026"),
    amount: 82.48,
    notiz: "Original 100$ (95.22$)",
    paidOut: true,
    received: true,
    sounds: [{ name: "Unbekannt", used: 8, total: 8 }],
    tiktokTarget: 0,
  });

  // Row 4: 14.09.2026 | 3 promos! (20€, 124,01€, 26,14€)
  //   Notiz: promo 2: original 142.98$
  //   Ausgezahlt: 1 Nein, 2 Nein, 3 Nein
  //   Done: 1/1; 8/8, 4/4; 3/3
  //   Song: 8/8: coffin rock, 4/4: talkin fye
  //   Angekommen: Ja/Ja/Ja
  // Promo 1:
  promos.push({
    name: "14.09. Promo 1",
    date: parseDate("14.09.2026"),
    amount: 20.0,
    notiz: "OriginalBetrag unbekannt",
    paidOut: false,
    received: true,
    sounds: [{ name: "Unbekannt", used: 1, total: 1 }],
    tiktokTarget: 0,
  });
  // Promo 2: 124,01€ with 2 sounds (coffin rock 8/8, talkin fye 4/4)
  promos.push({
    name: "14.09. – Coffin Rock / Talkin Fye",
    date: parseDate("14.09.2026"),
    amount: 124.01,
    notiz: "Promo 2 – Original 142.98$",
    paidOut: false,
    received: true,
    sounds: [
      { name: "Coffin Rock", used: 8, total: 8 },
      { name: "Talkin Fye", used: 4, total: 4 },
    ],
    tiktokTarget: 0,
  });
  // Promo 3:
  promos.push({
    name: "14.09. Promo 3",
    date: parseDate("14.09.2026"),
    amount: 26.14,
    notiz: "OriginalBetrag unbekannt",
    paidOut: false,
    received: true,
    sounds: [{ name: "Unbekannt", used: 3, total: 3 }],
    tiktokTarget: 0,
  });

  // Row 5: 15.09.2026 | 82,48€ | Notiz: original 100$/95.22$ | Done 10/10 | Song: 3/8: people are people | Ausgezahlt Nein | Angekommen Ja
  promos.push({
    name: "15.09. – People Are People",
    date: parseDate("15.09.2026"),
    amount: 82.48,
    notiz: "Original 100$ / 95.22$",
    paidOut: false,
    received: true,
    sounds: [{ name: "People Are People", used: 3, total: 8 }],
    tiktokTarget: 10,
  });

  // Row 6: 16.09.2026 | 31,38€ | Notiz: original 40$/37.94 | Done 3/3 | Song: I wanna kill myself | Ausgezahlt Nein | Angekommen Ja
  promos.push({
    name: "16.09. – I Wanna Kill Myself",
    date: parseDate("16.09.2026"),
    amount: 31.38,
    notiz: "Original 40$ / 37.94$",
    paidOut: false,
    received: true,
    sounds: [{ name: "I Wanna Kill Myself", used: 3, total: 3 }],
    tiktokTarget: 0,
  });

  // Row 7: 18.09.2026 | 87,07€ | Notiz: original 100$ | Done 10/10 | Song: Reposado | Ausgezahlt Nein | Angekommen Ja
  promos.push({
    name: "18.09. – Reposado",
    date: parseDate("18.09.2026"),
    amount: 87.07,
    notiz: "Original 100$",
    paidOut: false,
    received: true,
    sounds: [{ name: "Reposado", used: 10, total: 10 }],
    tiktokTarget: 0,
  });

  // Row 8: 24.09.2026 | 87,72€ | Notiz: original 100$ | Done 10/10 | Song: Stunt dummy | Ausgezahlt Nein | Angekommen Ja
  promos.push({
    name: "24.09. – Stunt Dummy",
    date: parseDate("24.09.2026"),
    amount: 87.72,
    notiz: "Original 100$",
    paidOut: false,
    received: true,
    sounds: [{ name: "Stunt Dummy", used: 10, total: 10 }],
    tiktokTarget: 0,
  });

  // Row 9: 29.09.2026 | 185,00€ | Notiz: original 200$ | Done 7/20 | Song: 5 hotellobby, 5 chinese insta song | Ausgezahlt Nein | Angekommen Ja
  promos.push({
    name: "29.09. – Hotellobby / Chinese Insta Song",
    date: parseDate("29.09.2026"),
    amount: 185.0,
    notiz: "Original 200$",
    paidOut: false,
    received: true,
    sounds: [
      { name: "Hotellobby", used: 5, total: 5 },
      { name: "Chinese Insta Song", used: 5, total: 5 },
    ],
    tiktokTarget: 20,
  });

  // Row 10: 03.10.2026 | 87,72€ | Notiz: original 100$ / An Maria | Done 1/10 | Song: Sixbill | Ausgezahlt "An Maria" | Angekommen Ja
  promos.push({
    name: "03.10. – Sixbill",
    date: parseDate("03.10.2026"),
    amount: 87.72,
    notiz: "Original 100$ – An Maria",
    paidOut: false,
    received: true,
    sounds: [{ name: "Sixbill", used: 1, total: 10 }],
    tiktokTarget: 10,
  });

  return promos;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Clearing existing data...");
  await db.tikTok.deleteMany();
  await db.payment.deleteMany();
  await db.promoSound.deleteMany();
  await db.promo.deleteMany();
  await db.sound.deleteMany();
  await db.customer.deleteMany();

  const parsed = parseRows();
  console.log(`Importing ${parsed.length} promos...`);

  let soundCount = 0;
  let paymentCount = 0;

  for (const p of parsed) {
    // Determine status: if all sounds fully used → ABGESCHLOSSEN, else AKTIV
    const allDone = p.sounds.every((s) => s.used >= s.total);
    const status = allDone ? "ABGESCHLOSSEN" : "AKTIV";

    // Create sounds and collect their IDs
    const soundLinks: { soundId: string; quantityTotal: number; quantityUsed: number }[] = [];
    for (const s of p.sounds) {
      if (s.name === "Unbekannt") {
        // Skip creating a sound for unnamed ones, but still track the ratio
        continue;
      }
      const soundId = await getOrCreateSound(s.name);
      soundLinks.push({
        soundId,
        quantityTotal: s.total,
        quantityUsed: s.used,
      });
      soundCount++;
    }

    // If no named sounds but there's a ratio, create a placeholder sound
    if (soundLinks.length === 0 && p.sounds.length > 0) {
      const s = p.sounds[0];
      const soundId = await getOrCreateSound("Unbekannter Sound");
      soundLinks.push({
        soundId,
        quantityTotal: s.total,
        quantityUsed: s.used,
      });
    }

    // Create the promo
    const promo = await db.promo.create({
      data: {
        name: p.name,
        date: p.date,
        status,
        notes: p.notiz || null,
        tiktokTarget: p.tiktokTarget,
        sounds: soundLinks.length
          ? {
              create: soundLinks.map((sl) => ({
                soundId: sl.soundId,
                quantityTotal: sl.quantityTotal,
                quantityUsed: sl.quantityUsed,
              })),
            }
          : undefined,
        payments: {
          create: [
            {
              amount: p.amount,
              expectedDate: p.date,
              payoutDate: p.paidOut ? p.date : null,
              receivedDate: p.received ? p.date : null,
              paidOut: p.paidOut,
              received: p.received,
              notes: p.notiz || null,
            },
          ],
        },
      },
    });
    paymentCount++;
    console.log(`  ✓ ${promo.name} (${p.amount.toFixed(2)}€) – ${status}`);
  }

  console.log(`\nImport complete: ${parsed.length} promos, ${soundCount} sound links, ${paymentCount} payments.`);
  console.log(`Unique sounds created: ${soundCache.size}`);
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
