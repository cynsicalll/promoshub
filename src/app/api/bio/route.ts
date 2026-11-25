import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BioVideo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  views?: number; // play count
  likes?: number;
}

export interface BioSocial {
  id: string;
  title: string;
  url: string;
  handle?: string;
  icon?: string;
}

export interface BioProject {
  id: string;
  title: string;
  description: string;
  url?: string;
  tags?: string[];
}

export interface BioMilestone {
  id: string;
  title: string;
  date: string; // ISO date string
  description?: string;
  icon?: string; // "trophy" | "users" | "eye" | "bike" | "ski" | "money"
}

export interface BioProfile {
  displayName: string;
  bio: string;
  tagline?: string;
  profileImage?: string;
  tiktokHandle: string;
  tiktokUrl: string;
  followers: number;
  following: number;
  totalLikes: number;
  videoCount: number;
  totalViews: number;
  showFollowers: boolean;
  showFollowing: boolean;
  showTotalLikes: boolean;
  showVideoCount: boolean;
  showTotalViews: boolean;
  socials: BioSocial[];
  projects: BioProject[];
  achievements: string[];
  videos: BioVideo[];
  milestones: BioMilestone[];
}

// ─── Default seed ────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: BioProfile = {
  displayName: "Cynsical",
  tagline: "Influencer · Entrepreneur · Yapper",
  bio: "i like money & fast things",
  profileImage: "",
  tiktokHandle: "sigmadudereal",
  tiktokUrl: "https://www.tiktok.com/@sigmadudereal",
  followers: 100000,
  following: 0,
  totalLikes: 10000000,
  videoCount: 50,
  totalViews: 100000000,
  showFollowers: true,
  showFollowing: false,
  showTotalLikes: true,
  showVideoCount: true,
  showTotalViews: true,
  socials: [
    {
      id: "social-tiktok",
      title: "TikTok",
      url: "https://www.tiktok.com/@sigmadudereal",
      handle: "@sigmadudereal",
      icon: "tiktok",
    },
  ],
  projects: [
    {
      id: "project-promos",
      title: "Promos",
      description:
        "Sound promo management system — track payments, splits, TikTok analytics and send push notifications for approvals.",
      url: "/?demo=viewer",
      tags: ["Next.js", "TypeScript", "Prisma", "TikTok API"],
    },
    {
      id: "project-clipvault",
      title: "ClipVault",
      description:
        "Watches Twitch streams 24/7, catches the moments chat reacts to, and edits them into vertical clips with facecam, titles and a rating. Closed beta.",
      url: "https://clipvault.live",
      tags: ["Twitch", "AI", "Video", "Automation"],
    },
  ],
  achievements: [
    "100K+ TikTok followers",
    "100M+ total views across content",
    "10M+ total likes on TikTok",
    "17-year-old entrepreneur & professional yapper",
    "Passionate skier (mainly park)",
    "Motocross/Surron rider & mountain biker",
  ],
  videos: [],
  milestones: [
    { id: "m1", title: "Started TikTok", date: "2024-06-01", icon: "users" },
    { id: "m2", title: "10K followers", date: "2024-09-15", icon: "users" },
    { id: "m3", title: "First 1M view video", date: "2025-01-20", icon: "eye" },
    { id: "m4", title: "100K followers", date: "2025-06-10", icon: "users" },
    { id: "m5", title: "Launched Promos", date: "2025-10-01", icon: "money" },
    { id: "m6", title: "100M+ total views", date: "2026-03-01", icon: "eye" },
  ],
};

const SETTING_KEY = "bio_profile";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getBioProfile(): Promise<BioProfile> {
  const row = await db.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return DEFAULT_PROFILE;
  try {
    const parsed = JSON.parse(row.value) as Partial<BioProfile>;
    // Merge with defaults so newly-added fields are always present
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET — public, returns the bio profile
export async function GET() {
  const profile = await getBioProfile();
  return NextResponse.json(profile);
}

// PUT — admin only, updates the bio profile
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = (await req.json()) as BioProfile;
  // Basic sanitisation: ensure arrays exist
  const sanitized: BioProfile = {
    ...DEFAULT_PROFILE,
    ...body,
    socials: Array.isArray(body.socials) ? body.socials : [],
    projects: Array.isArray(body.projects) ? body.projects : [],
    achievements: Array.isArray(body.achievements) ? body.achievements : [],
    videos: Array.isArray(body.videos) ? body.videos : [],
    milestones: Array.isArray(body.milestones) ? body.milestones : [],
  };

  await db.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(sanitized) },
    update: { value: JSON.stringify(sanitized) },
  });

  return NextResponse.json(sanitized);
}

// DELETE — admin only, resets the bio profile to defaults
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  await db.setting.deleteMany({ where: { key: SETTING_KEY } });
  return NextResponse.json({ ok: true, message: "Reset to defaults" });
}
