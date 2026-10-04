import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ShareData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Demo customer access link data
const DEMO_TOKEN = "demo-customer-access";

function getDemoCustomerData() {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

  const promos: ShareData[] = [
    {
      name: "Nike Summer Campaign",
      customerName: "Nike Europe",
      customerCompany: "Nike GmbH",
      date: daysAgo(45),
      status: "ABGESCHLOSSEN",
      notes: null, // notes hidden from customers
      tiktokTarget: 10,
      tiktokDone: 3,
      sounds: [
        { name: "Summer Vibes Beat", artist: "DJ Lumo", url: "https://www.tiktok.com/music/summer-vibes-123", quantityTotal: 10, quantityUsed: 10, quantityRemaining: 0 },
        { name: "Energetic Drop", artist: "BeatCo", url: "https://soundcloud.com/beatco/energetic-drop", quantityTotal: 5, quantityUsed: 5, quantityRemaining: 0 },
      ],
      tiktoks: [
        { url: "https://www.tiktok.com/@user/video/7111111111111", title: "Spot 1 – Beach", soundName: "Summer Vibes Beat", playCount: 15420, likeCount: 980, createdAt: daysAgo(40) },
        { url: "https://www.tiktok.com/@user/video/7222222222222", title: "Spot 2 – City", soundName: "Summer Vibes Beat", playCount: 22100, likeCount: 1450, createdAt: daysAgo(35) },
        { url: "https://www.tiktok.com/@user/video/7333333333333", title: "Spot 3 – Studio", soundName: "Energetic Drop", playCount: 8900, likeCount: 520, createdAt: daysAgo(30) },
      ],
    },
    {
      name: "Spotify Q3 Audio Ads",
      customerName: "Spotify Advertising",
      customerCompany: "Spotify AB",
      date: daysAgo(20),
      status: "AKTIV",
      notes: null,
      tiktokTarget: 8,
      tiktokDone: 2,
      sounds: [
        { name: "Urban Pulse", artist: "DJ Lumo", url: "https://soundcloud.com/djlumo/urban-pulse", quantityTotal: 8, quantityUsed: 3, quantityRemaining: 5 },
        { name: "Night Drive", artist: "Nova", url: null, quantityTotal: 4, quantityUsed: 1, quantityRemaining: 3 },
      ],
      tiktoks: [
        { url: "https://vm.tiktok.com/Zdemo1/", title: "Audio Teaser", soundName: "Urban Pulse", playCount: 5400, likeCount: 320, createdAt: daysAgo(18) },
        { url: "https://vm.tiktok.com/Zdemo2/", title: "Behind the Scenes", soundName: "Urban Pulse", playCount: 8200, likeCount: 610, createdAt: daysAgo(15) },
      ],
    },
  ];

  return {
    user: { displayName: "Demo Customer", username: "demo-customer" },
    promos,
  };
}

// Public endpoint: returns a customer's promos by direct-access token (no login)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Special demo token — returns example data
  if (token === DEMO_TOKEN) {
    return NextResponse.json(getDemoCustomerData());
  }

  const user = await db.user.findFirst({
    where: { shareToken: token, role: "CUSTOMER" },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Ungültiger oder deaktivierter Link." },
      { status: 404 }
    );
  }

  const promos = await db.promo.findMany({
    where: {
      userAccess: { some: { userId: user.id } },
    },
    include: {
      customer: true,
      sounds: { include: { sound: true } },
      tiktoks: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { date: "desc" },
  });

  // Map to safe ShareData (no payment/financial info)
  const data: ShareData[] = promos.map((promo) => ({
    name: promo.name,
    customerName: promo.customer?.name || null,
    customerCompany: promo.customer?.company || null,
    date: promo.date.toISOString(),
    status: promo.status as ShareData["status"],
    notes: promo.notes || null,
    tiktokTarget: promo.tiktokTarget || 0,
    tiktokDone: promo.tiktoks.length,
    sounds: promo.sounds.map((ps) => ({
      name: ps.sound.name,
      artist: ps.sound.artist,
      url: ps.sound.url,
      quantityTotal: ps.quantityTotal,
      quantityUsed: ps.quantityUsed,
      quantityRemaining: ps.quantityTotal - ps.quantityUsed,
    })),
    tiktoks: promo.tiktoks.map((t) => {
      const sound = promo.sounds.find((ps) => ps.soundId === t.soundId);
      return {
        url: t.url,
        title: t.title,
        soundName: sound?.sound.name || null,
        playCount: t.playCount,
        likeCount: t.likeCount,
        createdAt: t.createdAt.toISOString(),
      };
    }),
  }));

  return NextResponse.json({
    user: {
      displayName: user.displayName,
      username: user.username,
    },
    promos: data,
  });
}
