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

export interface BioProfile {
  displayName: string;
  bio: string;
  tagline?: string;
  profileImage?: string; // URL or empty for default avatar
  tiktokHandle: string;
  tiktokUrl: string;
  // Stats (editable numbers; 0 means hidden)
  followers: number;
  following: number;
  totalLikes: number;
  videoCount: number;
  // Show/hide stat tiles
  showFollowers: boolean;
  showFollowing: boolean;
  showTotalLikes: boolean;
  showVideoCount: boolean;
  // Collections
  socials: BioSocial[];
  projects: BioProject[];
  achievements: string[];
  videos: BioVideo[];
}

// ─── Default seed ────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: BioProfile = {
  displayName: "Cynsical",
  tagline: "Sound producer · TikTok creator · Building cool things on the web",
  bio: "Sound producer · TikTok creator · Building cool things on the web",
  profileImage: "",
  tiktokHandle: "sigmadudereal",
  tiktokUrl: "https://www.tiktok.com/@sigmadudereal",
  followers: 100000,
  following: 0,
  totalLikes: 15000,
  videoCount: 33,
  showFollowers: true,
  showFollowing: false,
  showTotalLikes: true,
  showVideoCount: true,
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
    "Videos with 1M+ views each",
    "Managing 15+ active promo campaigns",
    "33+ TikTok videos tracked with analytics",
    "Custom PWA with push notifications",
  ],
  videos: [],
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
  };

  await db.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(sanitized) },
    update: { value: JSON.stringify(sanitized) },
  });

  return NextResponse.json(sanitized);
}
