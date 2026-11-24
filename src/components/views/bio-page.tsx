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
  Eye,
  Wallet,
  Pencil,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BioProfile } from "@/app/api/bio/route";

export type LoginDestination = "financial" | "edit";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const FALLBACK: BioProfile = {
  displayName: "Cynsical",
  bio: "i like money & fast things",
  tagline: "Influencer · Entrepreneur · Yapper",
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
      url: "/?demo=viewer",
      tags: ["Next.js", "TypeScript", "Prisma", "TikTok API"],
    },
    {
      id: "clipvault",
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
};

// ─── TikTok Profile Embed ────────────────────────────────────────────────────
// Uses TikTok's official profile embed via an iframe.
// Shows a live preview of the creator's TikTok profile card.

function TikTokProfileEmbed({ handle }: { handle: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = React.useState(false);

  // TikTok's embed script creates a profile card from a blockquote.
  // We render the blockquote and load the embed script.
  React.useEffect(() => {
    // Load TikTok embed script if not already present
    const existing = document.getElementById("tiktok-embed-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "tiktok-embed-script";
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.head.appendChild(script);
    } else {
      // Re-run the embed processing
      // @ts-expect-error - TikTok embed API
      if (window.tiktokEmbed?.lib?.render) {
        // @ts-expect-error - TikTok embed API
        window.tiktokEmbed.lib.render();
      }
    }
    const timer = setTimeout(() => setLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, [handle]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 overflow-hidden flex justify-center"
    >
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@${handle}`}
        data-unique-id={handle}
        data-embed-type="creator"
        style={{ maxWidth: "780px", minWidth: "288px" }}
      >
        <section>
          <a
            href={`https://www.tiktok.com/@${handle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{handle}
          </a>
        </section>
      </blockquote>
      {!loaded && (
        <div className="flex items-center justify-center text-xs text-zinc-500 ml-4">
          <div className="h-3 w-3 animate-spin rounded-full border border-zinc-700 border-t-zinc-400 mr-2" />
          Loading TikTok profile…
        </div>
      )}
    </div>
  );
}

export function BioPage({ onLogin }: { onLogin: (destination: LoginDestination) => void }) {
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
  if (profile.showFollowers) {
    stats.push({
      label: "Followers",
      value: profile.followers > 0 ? formatCompact(profile.followers) : "—",
      icon: Users,
      color: "text-emerald-400",
    });
  }
  if (profile.showTotalViews) {
    stats.push({
      label: "Total Views",
      value: profile.totalViews > 0 ? `${formatCompact(profile.totalViews)}+` : "—",
      icon: Eye,
      color: "text-violet-400",
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
  if (profile.showVideoCount) {
    stats.push({
      label: "Videos",
      value: profile.videoCount > 0 ? `${formatCompact(profile.videoCount)}+` : "—",
      icon: Film,
      color: "text-white",
    });
  }

  return (
    <div className="min-h-screen bg-[#08070d] text-white relative overflow-hidden">
      {/* Animated aurora background — slow, organic drift */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Base wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0810] via-[#0b0913] to-[#08070d]" />

        {/* Aurora layer 1 — deep violet, top-left */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 55%)",
            animation: "auroraA 28s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        {/* Aurora layer 2 — magenta, right side */}
        <div
          className="absolute top-[25%] -right-[15%] w-[55vw] h-[55vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(217,70,239,0.16) 0%, transparent 55%)",
            animation: "auroraB 34s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        {/* Aurora layer 3 — warm teal accent, bottom */}
        <div
          className="absolute -bottom-[15%] left-[20%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 55%)",
            animation: "auroraC 40s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        {/* Aurora layer 4 — subtle warm rose, center */}
        <div
          className="absolute top-[40%] left-[35%] w-[40vw] h-[40vw] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 60%)",
            animation: "auroraD 46s ease-in-out infinite",
            willChange: "transform",
          }}
        />
      </div>

      {/* Film grain texture — breaks up flat gradients */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='250' height='250'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundRepeat: "repeat",
          backgroundSize: "250px 250px",
        }}
        aria-hidden="true"
      />

      {/* Equalizer / waveform motif — on-brand for a sound producer.
          Thin animated bars sitting at the very bottom, ambient. */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-end justify-center gap-[3px] h-20 pointer-events-none opacity-25"
        aria-hidden="true"
      >
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] sm:w-[4px] bg-gradient-to-t from-fuchsia-500 via-purple-400 to-violet-300 rounded-full"
            style={{
              height: "100%",
              transformOrigin: "bottom",
              animation: `eq ${0.5 + (i % 9) * 0.15}s ease-in-out ${i * 0.03}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Vignette — adds depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 50%, rgba(0,0,0,0.5) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Keyframes */}
      <style>{`
        @keyframes auroraA {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(8vw,5vh) scale(1.08); }
          66% { transform: translate(-4vw,8vh) scale(0.95); }
        }
        @keyframes auroraB {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-6vw,-4vh) scale(1.06); }
          66% { transform: translate(5vw,6vh) scale(0.97); }
        }
        @keyframes auroraC {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(5vw,-6vh) scale(1.05); }
          66% { transform: translate(-7vw,-3vh) scale(1.04); }
        }
        @keyframes auroraD {
          0%,100% { transform: translate(0,0) scale(1); opacity: 0.7; }
          50% { transform: translate(4vw,-5vh) scale(1.12); opacity: 1; }
        }
        @keyframes eq {
          0% { transform: scaleY(0.08); }
          100% { transform: scaleY(0.85); }
        }
      `}</style>

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

        {/* TikTok Profile Embed — live widget from TikTok */}
        {profile.tiktokHandle && (
          <div className="w-full max-w-2xl mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Music2 className="h-3.5 w-3.5" />
              TikTok Profile
            </h2>
            <TikTokProfileEmbed handle={profile.tiktokHandle} />
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

      {/* Bottom-left login button with destination menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="fixed bottom-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            title="Login"
            aria-label="Login"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-52 p-1.5 bg-zinc-900 border-white/10"
        >
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Sign in to…
          </div>
          <button
            onClick={() => onLogin("financial")}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
          >
            <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium">Financial</span>
              <span className="text-[10px] text-zinc-500">Promo manager & payments</span>
            </div>
          </button>
          <button
            onClick={() => onLogin("edit")}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
          >
            <Pencil className="h-4 w-4 text-fuchsia-400 shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium">Edit Page</span>
              <span className="text-[10px] text-zinc-500">Update this bio page</span>
            </div>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
