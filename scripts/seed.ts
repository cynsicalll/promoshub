import { db } from "../src/lib/db";

async function main() {
  await db.payment.deleteMany();
  await db.promoSound.deleteMany();
  await db.promo.deleteMany();
  await db.sound.deleteMany();
  await db.customer.deleteMany();

  const nike = await db.customer.create({ data: { name: "Nike Europe", company: "Nike GmbH", contactPerson: "Lisa Müller", email: "l.mueller@nike.com", notes: "Bevorzugt Rechnung am Monatsende." } });
  const spotify = await db.customer.create({ data: { name: "Spotify Advertising", company: "Spotify AB", contactPerson: "Jonas Berg", email: "jonas.berg@spotify.com" } });
  const redBull = await db.customer.create({ data: { name: "Red Bull Media", company: "Red Bull GmbH", contactPerson: "Anna Wagner", email: "a.wagner@redbull.com", notes: "Schnelle Rückmeldung, faire Preise." } });
  const adidas = await db.customer.create({ data: { name: "Adidas Originals", company: "Adidas AG", contactPerson: "Markus Fischer" } });
  const coca = await db.customer.create({ data: { name: "Coca-Cola DE", company: "Coca-Cola GmbH", contactPerson: "Sara Klein" } });

  const s1 = await db.sound.create({ data: { name: "Summer Vibes Beat", artist: "DJ Lumo", internalRef: "SVB-01", notes: "Upbeat, gut für Sommerkampagnen." } });
  const s2 = await db.sound.create({ data: { name: "Urban Pulse", artist: "DJ Lumo", internalRef: "UP-02" } });
  const s3 = await db.sound.create({ data: { name: "Night Drive", artist: "Nova", internalRef: "ND-03" } });
  const s4 = await db.sound.create({ data: { name: "Energetic Drop", artist: "BeatCo", internalRef: "ED-04" } });
  const s5 = await db.sound.create({ data: { name: "Soft Ambient Pad", artist: "Nova", internalRef: "SAP-05" } });
  const s6 = await db.sound.create({ data: { name: "Cinematic Hit", artist: "BeatCo", internalRef: "CH-06" } });

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
  const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000);

  await db.promo.create({
    data: {
      name: "Nike Summer Campaign",
      customerId: nike.id,
      date: daysAgo(45),
      status: "ABGESCHLOSSEN",
      notes: "3 Spots, alle Sounds wurden verwendet.",
      sounds: { create: [
        { soundId: s1.id, quantityTotal: 10, quantityUsed: 10 },
        { soundId: s4.id, quantityTotal: 5, quantityUsed: 5 },
      ] },
      payments: { create: [
        { amount: 500, expectedDate: daysAgo(40), payoutDate: daysAgo(38), receivedDate: daysAgo(35), paidOut: true, received: true, notes: "Überweisung" },
        { amount: 200, expectedDate: daysAgo(20), payoutDate: daysAgo(18), receivedDate: daysAgo(15), paidOut: true, received: true },
      ] },
    },
  });

  await db.promo.create({
    data: {
      name: "Spotify Q3 Audio Ads",
      customerId: spotify.id,
      date: daysAgo(20),
      status: "AKTIV",
      notes: "Laufende Kampagne, Sound 3 noch nicht verwendet.",
      sounds: { create: [
        { soundId: s2.id, quantityTotal: 8, quantityUsed: 3 },
        { soundId: s3.id, quantityTotal: 4, quantityUsed: 1 },
      ] },
      payments: { create: [
        { amount: 300, expectedDate: daysAgo(15), payoutDate: daysAgo(14), receivedDate: daysAgo(12), paidOut: true, received: true, notes: "PayPal" },
        { amount: 300, expectedDate: daysAhead(5), paidOut: false, received: false, notes: "Restbetrag nach Kampagnenende." },
      ] },
    },
  });

  await db.promo.create({
    data: {
      name: "Red Bull Extreme Series",
      customerId: redBull.id,
      date: daysAhead(10),
      status: "GEPLANT",
      notes: "Konzept steht, Sound-Auswahl offen.",
      sounds: { create: [{ soundId: s6.id, quantityTotal: 12, quantityUsed: 0 }] },
      payments: { create: [{ amount: 800, expectedDate: daysAhead(25), paidOut: false, received: false, notes: "30 Tage nach Veröffentlichung." }] },
    },
  });

  await db.promo.create({
    data: {
      name: "Adidas Originals Drop",
      customerId: adidas.id,
      date: daysAgo(60),
      status: "ABGESCHLOSSEN",
      notes: "Kunde hat sich noch nicht gemeldet wg. Zahlung.",
      sounds: { create: [{ soundId: s4.id, quantityTotal: 6, quantityUsed: 6 }] },
      payments: { create: [{ amount: 450, expectedDate: daysAgo(30), paidOut: false, received: false, notes: "Überfällig! Kunden anschreiben." }] },
    },
  });

  await db.promo.create({
    data: {
      name: "Coca-Cola Holiday Spot",
      customerId: coca.id,
      date: daysAgo(8),
      status: "AKTIV",
      sounds: { create: [{ soundId: s5.id, quantityTotal: 3, quantityUsed: 0 }] },
      payments: { create: [{ amount: 250, expectedDate: daysAgo(2), payoutDate: daysAgo(1), paidOut: true, received: false, notes: "Warten auf Eingang." }] },
    },
  });

  await db.promo.create({
    data: {
      name: "Coca-Cola Winter Remix",
      customerId: coca.id,
      date: daysAgo(50),
      status: "STORNIERT",
      notes: "Kunde hat Kampagne abgesagt.",
    },
  });

  console.log("Seed completed.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
