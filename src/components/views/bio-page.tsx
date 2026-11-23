"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AudioLines,
  Lock,
  ExternalLink,
  Music2,
  Video,
  Trophy,
  Heart,
  Sparkles,
  ArrowUpRight,
  Play,
  Users,
  ThumbsUp,
  Film,
} from "lucide-react";
import type { BioProfile } from "@/app/api/bio/route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const FALLBACK: BioProfile = {
  displayName: "Cynsical",
  bio: "Sound producer · TikTok creator · Building cool things on the web",
  tagline: "Sound producer · TikTok creator · Building cool things on the web",
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
      id: "tiktok",
      title: "TikTok",
      url: "https://www.tiktok.com/@sigmadudereal",
      handle: "@sigmadudereal",
      icon: "tiktok",
    },
  ],
  projects: [
    {
      id: "promos",
      title: "Promos",
      description:
        "Sound promo management system — manage promos, payments, customers & TikTok analytics.",
      url: "https://sigmadude.vercel.app",
      tags: ["Next.js", "TypeScript", "Prisma", "TikTok API"],
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

export function BioPage({ onLogin }: { onLogin: () => void }) {
  const { data, isLoading } = useQuery<BioProfile>({
    queryKey: ["bio-profile"],
    queryFn: async () => {
      const res = await fetch("/api/bio");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const profile = data ?? FALLBACK;

  // Build the visible stat tiles dynamically
  const stats: { label: string; value: string; icon: React.ElementType; color: string }[] = [];
  if (profile.showVideoCount) {
    stats.push({
      label: "Videos",
      value: profile.videoCount > 0 ? `${formatCompact(profile.videoCount)}+` : "—",
      icon: Film,
      color: "text-white",
    });
  }
  if (profile.showFollowers) {
    stats.push({
      label: "Followers",
      value: profile.followers > 0 ? `${formatCompact(profile.followers)}` : "—",
      icon: Users,
      color: "text-emerald-400",
    });
  }
  if (profile.showTotalLikes) {
    stats.push({
      label: "Total Likes",
      value: profile.totalLikes > 0 ? `${formatCompact(profile.totalLikes)}+` : "—",
      icon: ThumbsUp,
      color: "text-rose-400",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-600 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8 sm:py-12">
        {/* Avatar / Name */}
        <div className="flex flex-col items-center gap-4 mb-10 mt-8">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-emerald-500 p-1 shadow-2xl shadow-fuchsia-500/30">
              <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                {profile.profileImage ? (
                   
                  <img
                    src={profile.profileImage}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AudioLines className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
              {profile.displayName}
            </h1>
            {(profile.tagline || profile.bio) && (
              <p className="text-sm text-zinc-400 mt-1 max-w-md">
                {profile.tagline || profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Socials */}
        {profile.socials.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {profile.socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <span className="text-sm font-medium">{s.title}</span>
                {s.handle && <span className="text-xs text-zinc-400">{s.handle}</span>}
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        )}

        {/* TikTok Stats */}
        {stats.length > 0 && (
          <div className="w-full max-w-2xl mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Music2 className="h-3.5 w-3.5" />
              TikTok Stats
            </h2>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
            >
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 text-center"
                  >
                    <Icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Most Popular Videos */}
        {profile.videos.length > 0 && (
          <div className="w-full max-w-2xl mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Video className="h-3.5 w-3.5" />
              Popular Videos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.videos.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-fuchsia-400/50 transition-all"
                >
                  {v.thumbnail ? (
                     
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Video className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-4 w-4 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                  {/* View count badge */}
                  {typeof v.views === "number" && v.views > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white flex items-center gap-1">
                        <Play className="h-2.5 w-2.5 fill-white" />
                        {formatCompact(v.views)}
                      </span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {profile.projects.length > 0 && (
          <div className="w-full max-w-2xl space-y-4 mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Video className="h-3.5 w-3.5" />
              Projects
            </h2>
            {profile.projects.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-fuchsia-400/50 hover:bg-white/[0.08] transition-all p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{p.title}</h3>
                      <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-fuchsia-400 transition-colors" />
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{p.description}</p>
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Achievements */}
        {profile.achievements.length > 0 && (
          <div className="w-full max-w-2xl space-y-3 mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" />
              Achievements
            </h2>
            {profile.achievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-3"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-sm text-zinc-300">{a}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator (only on first load) */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-600 mb-4">
            <div className="h-3 w-3 animate-spin rounded-full border border-zinc-700 border-t-zinc-400" />
            <span>Loading…</span>
          </div>
        )}

        {/* Made with love */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-4">
          <span>Built with</span>
          <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
          <span>by {profile.displayName}</span>
        </div>
      </div>

      {/* Bottom-left login button */}
      <button
        onClick={onLogin}
        className="fixed bottom-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        title="Staff Login"
        aria-label="Login"
      >
        <Lock className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
