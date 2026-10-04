import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import type { Promo, Customer, Sound, Payment, DashboardData, MonthlyEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

// Returns example/demo data for DEMO role users
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (session.role !== "DEMO" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // ─── Example Customers ──────────────────────────────
  const customers: Customer[] = [
    { id: "demo-c1", name: "Nike Europe", company: "Nike GmbH", contactPerson: "Lisa Müller", email: "l.mueller@nike.com", phone: "+49 123 456789", notes: "Prefers invoice at month end.", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "demo-c2", name: "Spotify Advertising", company: "Spotify AB", contactPerson: "Jonas Berg", email: "jonas@spotify.com", phone: null, notes: null, createdAt: "2026-08-15T00:00:00.000Z", updatedAt: "2026-08-15T00:00:00.000Z" },
    { id: "demo-c3", name: "Red Bull Media", company: "Red Bull GmbH", contactPerson: "Anna Wagner", email: "a.wagner@redbull.com", phone: "+43 1 234 5678", notes: "Fast responses, fair prices.", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z" },
  ];

  // ─── Example Sounds ─────────────────────────────────
  const sounds: Sound[] = [
    { id: "demo-s1", name: "Summer Vibes Beat", artist: "DJ Lumo", internalRef: "SVB-01", url: "https://www.tiktok.com/music/summer-vibes-123", notes: "Upbeat, good for summer.", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "demo-s2", name: "Urban Pulse", artist: "DJ Lumo", internalRef: "UP-02", url: "https://soundcloud.com/djlumo/urban-pulse", notes: null, createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "demo-s3", name: "Night Drive", artist: "Nova", internalRef: "ND-03", url: null, notes: null, createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "demo-s4", name: "Energetic Drop", artist: "BeatCo", internalRef: "ED-04", url: "https://soundcloud.com/beatco/energetic-drop", notes: null, createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "demo-s5", name: "Cinematic Hit", artist: "BeatCo", internalRef: "CH-05", url: null, notes: "Epic trailer sound.", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
  ];

  // ─── Example Promos ─────────────────────────────────
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();

  const promos: Promo[] = [
    {
      id: "demo-p1",
      name: "Nike Summer Campaign",
      customerId: "demo-c1",
      date: daysAgo(45),
      status: "ABGESCHLOSSEN",
      notes: "3 spots, all sounds used.",
      tiktokTarget: 10,
      shareCode: null,
      shareEnabled: false,
      createdAt: daysAgo(50),
      updatedAt: daysAgo(10),
      customer: customers[0],
      sounds: [
        { id: "demo-ps1", promoId: "demo-p1", soundId: "demo-s1", quantityTotal: 10, quantityUsed: 10, sound: sounds[0] },
        { id: "demo-ps2", promoId: "demo-p1", soundId: "demo-s4", quantityTotal: 5, quantityUsed: 5, sound: sounds[3] },
      ],
      payments: [
        { id: "demo-pay1", promoId: "demo-p1", amount: 500, expectedDate: daysAgo(40), payoutDate: daysAgo(38), receivedDate: daysAgo(35), paidOut: true, received: true, notes: "Bank transfer", createdAt: daysAgo(50), updatedAt: daysAgo(35) },
        { id: "demo-pay2", promoId: "demo-p1", amount: 200, expectedDate: daysAgo(20), payoutDate: daysAgo(18), receivedDate: daysAgo(15), paidOut: true, received: true, notes: null, createdAt: daysAgo(50), updatedAt: daysAgo(15) },
      ],
      tiktoks: [
        { id: "demo-t1", promoId: "demo-p1", soundId: "demo-s1", url: "https://www.tiktok.com/@user/video/7111111111111", title: "Spot 1 – Beach", playCount: 15420, likeCount: 980, commentCount: 45, shareCount: 120, statsSynced: daysAgo(5), createdAt: daysAgo(40) },
        { id: "demo-t2", promoId: "demo-p1", soundId: "demo-s1", url: "https://www.tiktok.com/@user/video/7222222222222", title: "Spot 2 – City", playCount: 22100, likeCount: 1450, commentCount: 89, shareCount: 230, statsSynced: daysAgo(5), createdAt: daysAgo(35) },
        { id: "demo-t3", promoId: "demo-p1", soundId: "demo-s4", url: "https://www.tiktok.com/@user/video/7333333333333", title: "Spot 3 – Studio", playCount: 8900, likeCount: 520, commentCount: 23, shareCount: 67, statsSynced: daysAgo(5), createdAt: daysAgo(30) },
      ],
    },
    {
      id: "demo-p2",
      name: "Spotify Q3 Audio Ads",
      customerId: "demo-c2",
      date: daysAgo(20),
      status: "AKTIV",
      notes: "Ongoing campaign, sound 3 not used yet.",
      tiktokTarget: 8,
      shareCode: null,
      shareEnabled: false,
      createdAt: daysAgo(25),
      updatedAt: daysAgo(5),
      customer: customers[1],
      sounds: [
        { id: "demo-ps3", promoId: "demo-p2", soundId: "demo-s2", quantityTotal: 8, quantityUsed: 3, sound: sounds[1] },
        { id: "demo-ps4", promoId: "demo-p2", soundId: "demo-s3", quantityTotal: 4, quantityUsed: 1, sound: sounds[2] },
      ],
      payments: [
        { id: "demo-pay3", promoId: "demo-p2", amount: 300, expectedDate: daysAgo(15), payoutDate: daysAgo(14), receivedDate: daysAgo(12), paidOut: true, received: true, notes: "PayPal", createdAt: daysAgo(25), updatedAt: daysAgo(12) },
        { id: "demo-pay4", promoId: "demo-p2", amount: 300, expectedDate: daysAhead(5), payoutDate: null, receivedDate: null, paidOut: false, received: false, notes: "Remaining after campaign end.", createdAt: daysAgo(25), updatedAt: daysAgo(25) },
      ],
      tiktoks: [
        { id: "demo-t4", promoId: "demo-p2", soundId: "demo-s2", url: "https://vm.tiktok.com/Zdemo1/", title: "Audio Teaser", playCount: 5400, likeCount: 320, commentCount: 12, shareCount: 45, statsSynced: daysAgo(3), createdAt: daysAgo(18) },
        { id: "demo-t5", promoId: "demo-p2", soundId: "demo-s2", url: "https://vm.tiktok.com/Zdemo2/", title: "Behind the Scenes", playCount: 8200, likeCount: 610, commentCount: 34, shareCount: 89, statsSynced: daysAgo(3), createdAt: daysAgo(15) },
      ],
    },
    {
      id: "demo-p3",
      name: "Red Bull Extreme Series",
      customerId: "demo-c3",
      date: daysAhead(10),
      status: "GEPLANT",
      notes: "Concept ready, sound selection open.",
      tiktokTarget: 15,
      shareCode: null,
      shareEnabled: false,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
      customer: customers[2],
      sounds: [
        { id: "demo-ps5", promoId: "demo-p3", soundId: "demo-s5", quantityTotal: 12, quantityUsed: 0, sound: sounds[4] },
      ],
      payments: [
        { id: "demo-pay5", promoId: "demo-p3", amount: 800, expectedDate: daysAhead(25), payoutDate: null, receivedDate: null, paidOut: false, received: false, notes: "30 days after publication.", createdAt: daysAgo(5), updatedAt: daysAgo(5) },
      ],
      tiktoks: [],
    },
    {
      id: "demo-p4",
      name: "Adidas Originals Drop",
      customerId: null,
      date: daysAgo(60),
      status: "ABGESCHLOSSEN",
      notes: "Overdue payment — follow up!",
      tiktokTarget: 6,
      shareCode: null,
      shareEnabled: false,
      createdAt: daysAgo(65),
      updatedAt: daysAgo(60),
      customer: null,
      sounds: [
        { id: "demo-ps6", promoId: "demo-p4", soundId: "demo-s4", quantityTotal: 6, quantityUsed: 6, sound: sounds[3] },
      ],
      payments: [
        { id: "demo-pay6", promoId: "demo-p4", amount: 450, expectedDate: daysAgo(30), payoutDate: null, receivedDate: null, paidOut: false, received: false, notes: "OVERDUE! Contact customer.", createdAt: daysAgo(65), updatedAt: daysAgo(65) },
      ],
      tiktoks: [
        { id: "demo-t6", promoId: "demo-p4", soundId: "demo-s4", url: "https://vm.tiktok.com/Zdemo3/", title: "Drop Teaser", playCount: 12300, likeCount: 870, commentCount: 56, shareCount: 134, statsSynced: daysAgo(7), createdAt: daysAgo(55) },
      ],
    },
  ];

  // ─── Dashboard data ─────────────────────────────────
  const allPayments = promos.flatMap((p) => p.payments.map((pay) => ({ ...pay, promo: p })));
  const totalEarned = allPayments.reduce((s, p) => s + p.amount, 0);
  const received = allPayments.filter((p) => p.received).reduce((s, p) => s + p.amount, 0);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly: { month: string; earned: number; received: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const label = `${monthNames[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`;
    const earned = allPayments
      .filter((p) => {
        const d = new Date(p.promo.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === key;
      })
      .reduce((s, p) => s + p.amount, 0);
    const rec = allPayments
      .filter((p) => p.receivedDate && `${new Date(p.receivedDate).getFullYear()}-${String(new Date(p.receivedDate).getMonth() + 1).padStart(2, "0")}` === key)
      .reduce((s, p) => s + p.amount, 0);
    monthly.push({ month: label, earned, received: rec });
  }

  const dashboard: DashboardData = {
    counts: {
      total: promos.length,
      aktiv: promos.filter((p) => p.status === "AKTIV").length,
      geplant: promos.filter((p) => p.status === "GEPLANT").length,
      abgeschlossen: promos.filter((p) => p.status === "ABGESCHLOSSEN").length,
      storniert: 0,
      openSoundsRemaining: promos
        .filter((p) => p.status !== "STORNIERT")
        .reduce((s, p) => s + p.sounds.reduce((x, ps) => x + (ps.quantityTotal - ps.quantityUsed), 0), 0),
    },
    money: {
      totalEarned,
      received,
      outstanding: totalEarned - received,
      paidOut: allPayments.filter((p) => p.paidOut).reduce((s, p) => s + p.amount, 0),
      notPaidOut: totalEarned - allPayments.filter((p) => p.paidOut).reduce((s, p) => s + p.amount, 0),
    },
    recentPromos: promos.slice(0, 6),
    recentPayments: allPayments
      .filter((p) => p.received && p.receivedDate)
      .sort((a, b) => new Date(b.receivedDate!).getTime() - new Date(a.receivedDate!).getTime())
      .slice(0, 6) as (Payment & { promo: Promo })[],
    overduePayments: allPayments.filter((p) => {
      if (p.received) return false;
      if (!p.expectedDate) return false;
      return new Date(p.expectedDate).getTime() < Date.now();
    }) as (Payment & { promo: Promo })[],
    monthly,
  };

  // ─── Monthly entries ────────────────────────────────
  const monthlyEntries: MonthlyEntry[] = [];
  for (let m = 0; m < 12; m++) {
    const monthPromos = promos.filter((p) => new Date(p.date).getMonth() === m);
    const earned = monthPromos.reduce((s, p) => s + p.payments.reduce((x, pay) => x + pay.amount, 0), 0);
    const rec = monthPromos.reduce((s, p) => s + p.payments.filter((pay) => pay.received).reduce((x, pay) => x + pay.amount, 0), 0);
    const tiktoks = monthPromos.reduce((s, p) => s + p.tiktoks.length, 0);
    monthlyEntries.push({
      key: `${now.getFullYear()}-${String(m + 1).padStart(2, "0")}`,
      label: `${monthNames[m]} ${String(now.getFullYear()).slice(2)}`,
      promos: monthPromos.length,
      earned,
      received: rec,
      outstanding: earned - rec,
      tiktoks,
    });
  }

  // ─── Stats ──────────────────────────────────────────
  const allTiktoks = promos.flatMap((p) => p.tiktoks.map((t) => ({ ...t, promo: p })));
  const withStats = allTiktoks.filter((t) => t.playCount !== null);
  const totalViews = withStats.reduce((s, t) => s + (t.playCount || 0), 0);
  const totalLikes = withStats.reduce((s, t) => s + (t.likeCount || 0), 0);

  return NextResponse.json({
    promos,
    sounds,
    customers,
    dashboard,
    monthly: { year: now.getFullYear(), years: [now.getFullYear()], entries: monthlyEntries },
    stats: {
      totalVideos: allTiktoks.length,
      videosWithStats: withStats.length,
      totalViews,
      totalLikes,
      totalComments: withStats.reduce((s, t) => s + (t.commentCount || 0), 0),
      totalShares: withStats.reduce((s, t) => s + (t.shareCount || 0), 0),
      avgViews: withStats.length > 0 ? Math.round(totalViews / withStats.length) : 0,
      avgLikes: withStats.length > 0 ? Math.round(totalLikes / withStats.length) : 0,
      topVideos: withStats
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 10)
        .map((t) => ({
          id: t.id,
          url: t.url,
          title: t.title,
          playCount: t.playCount,
          likeCount: t.likeCount,
          commentCount: t.commentCount,
          shareCount: t.shareCount,
          promoName: t.promo.name,
          createdAt: t.createdAt,
        })),
      promoBreakdown: promos.map((p) => ({
        promoId: p.id,
        promoName: p.name,
        videoCount: p.tiktoks.length,
        totalViews: p.tiktoks.reduce((s, t) => s + (t.playCount || 0), 0),
        totalLikes: p.tiktoks.reduce((s, t) => s + (t.likeCount || 0), 0),
        avgViews: p.tiktoks.length > 0 ? Math.round(p.tiktoks.reduce((s, t) => s + (t.playCount || 0), 0) / p.tiktoks.length) : 0,
      })),
      lastSynced: daysAgo(1),
    },
    // Demo customer access link (works on /c/demo-customer-access)
    demoCustomerLink: "/c/demo-customer-access",
    // Demo users list (for settings page display)
    demoUsers: [
      {
        id: "demo-u1",
        username: "nike_lisa",
        displayName: "Lisa Müller (Nike)",
        role: "CUSTOMER",
        createdAt: daysAgo(30),
        shareToken: "demo-customer-access",
        promoAccess: [
          { promo: { id: "demo-p1", name: "Nike Summer Campaign", date: daysAgo(45), status: "ABGESCHLOSSEN" } },
          { promo: { id: "demo-p2", name: "Spotify Q3 Audio Ads", date: daysAgo(20), status: "AKTIV" } },
        ],
      },
    ],
  });
}
