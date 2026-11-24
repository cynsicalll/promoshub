"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Lock,
  ExternalLink,
  ArrowUpRight,
  Play,
  Eye,
  Wallet,
  Pencil,
  Users,
  ThumbsUp,
  Film,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BioProfile } from "@/app/api/bio/route";

export type LoginDestination = "financial" | "edit";

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
      description: "Sound promo management system — manage promos, payments, customers & TikTok analytics.",
      url: "/?demo=viewer",
      tags: ["Next.js", "TypeScript", "Prisma", "TikTok API"],
    },
    {
      id: "clipvault",
      title: "ClipVault",
      description: "Watches Twitch streams 24/7, catches the moments chat reacts to, and edits them into vertical clips with facecam, titles and a rating. Closed beta.",
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

function TikTokProfileEmbed({ handle }: { handle: string }) {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const existing = document.getElementById("tiktok-embed-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "tiktok-embed-script";
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.head.appendChild(script);
    }
    const timer = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, [handle]);

  return (
    <div className="rounded-xl border border-[var(--bp-border)] bg-[var(--bp-surface)] p-3 overflow-hidden flex justify-center min-h-[120px]">
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@${handle}`}
        data-unique-id={handle}
        data-embed-type="creator"
        style={{ maxWidth: "780px", minWidth: "288px" }}
      >
        <section>
          <a href={`https://www.tiktok.com/@${handle}`} target="_blank" rel="noopener noreferrer">
            @{handle}
          </a>
        </section>
      </blockquote>
      {!loaded && (
        <div className="flex items-center text-xs text-[var(--bp-text-muted)]">
          <div className="h-3 w-3 animate-spin rounded-full border border-[var(--bp-border)] border-t-[var(--bp-accent)] mr-2" />
          Loading…
        </div>
      )}
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-3">
      <p className="text-xl font-semibold tabular-nums text-[var(--bp-text)]" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
      <p className="text-[11px] text-[var(--bp-text-muted)] mt-0.5 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
    </div>
  );
}

// ─── Bio Page ────────────────────────────────────────────────────────────────

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

  const stats: { label: string; value: string; icon: React.ElementType }[] = [];
  if (profile.showFollowers && profile.followers > 0) {
    stats.push({ label: "Followers", value: formatCompact(profile.followers), icon: Users });
  }
  if (profile.showTotalViews && (profile.totalViews ?? 0) > 0) {
    stats.push({ label: "Views", value: `${formatCompact(profile.totalViews!)}+`, icon: Eye });
  }
  if (profile.showTotalLikes && profile.totalLikes > 0) {
    stats.push({ label: "Likes", value: `${formatCompact(profile.totalLikes)}+`, icon: ThumbsUp });
  }
  if (profile.showVideoCount && profile.videoCount > 0) {
    stats.push({ label: "Videos", value: `${formatCompact(profile.videoCount)}+`, icon: Film });
  }

  return (
    <div className="min-h-screen bg-[var(--bp-bg)] text-[var(--bp-text)] relative">
      {/* Entrance animation — one calm fade-in, respects reduced-motion */}
      <style>{`
        @keyframes page-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-enter > * {
          animation: page-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .page-enter > *:nth-child(1) { animation-delay: 0ms; }
        .page-enter > *:nth-child(2) { animation-delay: 60ms; }
        .page-enter > *:nth-child(3) { animation-delay: 120ms; }
        .page-enter > *:nth-child(4) { animation-delay: 180ms; }
        .page-enter > *:nth-child(5) { animation-delay: 240ms; }
        .page-enter > *:nth-child(6) { animation-delay: 300ms; }
        .page-enter > *:nth-child(7) { animation-delay: 360ms; }
        @media (prefers-reduced-motion: reduce) {
          .page-enter > * { animation: none !important; }
        }
      `}</style>

      <div className="page-enter relative z-10 mx-auto max-w-xl px-5 py-12 sm:py-16 flex flex-col gap-10">
        {/* Hero — left-aligned, no gradient text, no glow */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar — simple circle, no gradient ring */}
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--bp-border)] bg-[var(--bp-surface)] shrink-0">
              {profile.profileImage ? (
                 
                <img src={profile.profileImage} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--bp-text-muted)] text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--bp-text)]" style={{ fontFamily: "var(--font-display)" }}>
                {profile.displayName}
              </h1>
              {(profile.tagline || profile.bio) && (
                <p className="text-sm text-[var(--bp-text-muted)] mt-0.5">
                  {profile.tagline || profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Socials — pill buttons, clean */}
          {profile.socials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-xs font-medium text-[var(--bp-text)] transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[var(--bp-accent)] hover:text-[var(--bp-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--bp-accent)]/30"
                >
                  {s.title}
                  {s.handle && <span className="text-[var(--bp-text-muted)] group-hover:text-[var(--bp-accent)]/70">{s.handle}</span>}
                  <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          )}
        </header>

        {/* Stats — clean grid, no glow, no gradient */}
        {stats.length > 0 && (
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-[var(--bp-text-muted)] mb-2.5">
              Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.map((s) => (
                <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
              ))}
            </div>
          </section>
        )}

        {/* TikTok profile embed */}
        {profile.tiktokHandle && (
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-[var(--bp-text-muted)] mb-2.5">
              TikTok
            </h2>
            <TikTokProfileEmbed handle={profile.tiktokHandle} />
          </section>
        )}

        {/* Videos — varied height grid, not identical cards */}
        {profile.videos.length > 0 && (
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-[var(--bp-text-muted)] mb-2.5">
              Popular videos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {profile.videos.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[9/16] rounded-lg overflow-hidden border border-[var(--bp-border)] bg-[var(--bp-surface)] transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[var(--bp-accent)]"
                >
                  {v.thumbnail ? (
                     
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-[var(--bp-text-muted)]" />
                    </div>
                  )}
                  {typeof v.views === "number" && v.views > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm flex items-center gap-0.5">
                      <Play className="h-2 w-2 fill-white" />
                      {formatCompact(v.views)}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Projects — varied descriptions, not identical cards */}
        {profile.projects.length > 0 && (
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-[var(--bp-text-muted)] mb-2.5">
              Projects
            </h2>
            <div className="flex flex-col gap-2">
              {profile.projects.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[var(--bp-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--bp-accent)]/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="text-base font-medium text-[var(--bp-text)]" style={{ fontFamily: "var(--font-display)" }}>
                          {p.title}
                        </h3>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[var(--bp-text-muted)] group-hover:text-[var(--bp-accent)] transition-colors" />
                      </div>
                      <p className="text-xs text-[var(--bp-text-muted)] mt-1 leading-relaxed">{p.description}</p>
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--bp-border)] text-[var(--bp-text-muted)]">
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
          </section>
        )}

        {/* Achievements — simple list, no trophy icons everywhere */}
        {profile.achievements.length > 0 && (
          <section>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-[var(--bp-text-muted)] mb-2.5">
              About
            </h2>
            <ul className="flex flex-col gap-1.5">
              {profile.achievements.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[var(--bp-text)]">
                  <span className="w-1 h-1 rounded-full bg-[var(--bp-accent)] shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer — single closing line */}
        <footer className="pt-6 border-t border-[var(--bp-border)] text-center">
          <p className="text-xs text-[var(--bp-text-muted)]">
            {profile.displayName} · {profile.tiktokHandle && `@${profile.tiktokHandle}`}
          </p>
        </footer>
      </div>

      {/* Bottom-left login — minimal, no glow */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="fixed bottom-4 left-4 z-50 flex h-7 w-7 items-center justify-center rounded-md border border-[var(--bp-border)] bg-[var(--bp-surface)] text-[var(--bp-text-muted)] transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-[var(--bp-text)] hover:border-[var(--bp-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--bp-accent)]/30"
            title="Sign in"
            aria-label="Sign in"
          >
            <Lock className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-48 p-1 bg-[var(--bp-surface)] border-[var(--bp-border)]"
        >
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--bp-text-muted)]">
            Sign in to
          </div>
          <button
            onClick={() => onLogin("financial")}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--bp-text)] transition-colors duration-100 hover:bg-[var(--bp-bg)]"
          >
            <Wallet className="h-4 w-4 text-[var(--bp-accent)] shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium">Financial</span>
              <span className="text-[10px] text-[var(--bp-text-muted)]">Promo manager</span>
            </div>
          </button>
          <button
            onClick={() => onLogin("edit")}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--bp-text)] transition-colors duration-100 hover:bg-[var(--bp-bg)]"
          >
            <Pencil className="h-4 w-4 text-[var(--bp-accent)] shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium">Edit page</span>
              <span className="text-[10px] text-[var(--bp-text-muted)]">Update this bio</span>
            </div>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
