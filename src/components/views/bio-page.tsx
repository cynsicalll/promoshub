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
  Trophy,
  Bike,
  Snowflake,
  DollarSign,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BioProfile, BioMilestone } from "@/app/api/bio/route";

export type LoginDestination = "financial" | "edit";

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  users: Users,
  eye: Eye,
  bike: Bike,
  ski: Snowflake,
  money: DollarSign,
};

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
  socials: [{ id: "tiktok", title: "TikTok", url: "https://www.tiktok.com/@sigmadudereal", handle: "@sigmadudereal", icon: "tiktok" }],
  projects: [
    { id: "promos", title: "Promos", description: "Sound promo management system.", url: "/?demo=viewer", tags: ["Next.js", "TypeScript"] },
    { id: "clipvault", title: "ClipVault", description: "Watches Twitch streams 24/7.", url: "https://clipvault.live", tags: ["Twitch", "AI"] },
  ],
  achievements: ["100K+ TikTok followers", "100M+ total views", "17yo entrepreneur & professional yapper", "Passionate skier (mainly park)", "Motocross/Surron rider & mountain biker"],
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

// ─── Apple-style liquid glass class ──────────────────────────────────────────

const GLASS = "apple-glass";

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
    <div className={`${GLASS} rounded-2xl p-3 overflow-hidden flex justify-center min-h-[120px]`}>
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@${handle}`}
        data-unique-id={handle}
        data-embed-type="creator"
        style={{ maxWidth: "780px", minWidth: "288px" }}
      >
        <section><a href={`https://www.tiktok.com/@${handle}`} target="_blank" rel="noopener noreferrer">@{handle}</a></section>
      </blockquote>
      {!loaded && (
        <div className="flex items-center text-xs text-[var(--bp-text-muted)]">
          <div className="h-3 w-3 animate-spin rounded-full border border-white/10 border-t-[var(--bp-accent)] mr-2" />
          Loading…
        </div>
      )}
    </div>
  );
}

// ─── Scroll reveal hook (IntersectionObserver) ───────────────────────────────

function useScrollReveal<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ─── Milestone Timeline ──────────────────────────────────────────────────────

function MilestoneTimeline({ milestones }: { milestones: BioMilestone[] }) {
  // Sort by date descending (most recent first)
  const sorted = [...milestones].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10 overflow-hidden">
        <div className="timeline-line-draw" />
      </div>

      <div className="flex flex-col gap-4">
        {sorted.map((m, i) => (
          <MilestoneCard key={m.id} milestone={m} isLatest={i === 0} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, isLatest, delay }: { milestone: BioMilestone; isLatest: boolean; delay: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const Icon = milestone.icon ? ICON_MAP[milestone.icon] : null;

  return (
    <div
      ref={ref}
      className="relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-16px)",
        transition: `opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
    >
      {/* Dot on the timeline */}
      <div
        className={`absolute -left-6 top-3 w-3.5 h-3.5 rounded-full ${isLatest ? "dot-pulse" : ""}`}
        style={{
          background: isLatest ? "var(--bp-accent)" : "rgba(255,255,255,0.2)",
          boxShadow: isLatest ? "0 0 0 3px rgba(0,122,255,0.15)" : "none",
        }}
      />

      {/* Card */}
      <div className={`${GLASS} rounded-2xl p-4`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 text-[var(--bp-text-muted)]" />}
            <h3 className="text-sm font-medium text-[var(--bp-text)]" style={{ fontFamily: "var(--font-display)" }}>
              {milestone.title}
            </h3>
          </div>
          <span className="text-[11px] text-[var(--bp-text-muted)] font-medium tabular-nums">
            {formatDate(milestone.date)}
          </span>
        </div>
        {milestone.description && (
          <p className="text-xs text-[var(--bp-text-muted)] leading-relaxed">{milestone.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className={`${GLASS} rounded-2xl px-4 py-3 text-center`}>
      <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-[var(--bp-text-muted)]" />
      <p className="text-xl font-semibold tabular-nums text-[var(--bp-text)]" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--bp-text-muted)] mt-0.5">{label}</p>
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

  // Cursor glow — neutral white, barely visible
  const cursorRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const stats: { label: string; value: string; icon: React.ElementType }[] = [];
  if (profile.showFollowers && profile.followers > 0)
    stats.push({ label: "Followers", value: formatCompact(profile.followers), icon: Users });
  if (profile.showTotalViews && (profile.totalViews ?? 0) > 0)
    stats.push({ label: "Views", value: `${formatCompact(profile.totalViews!)}+`, icon: Eye });
  if (profile.showTotalLikes && profile.totalLikes > 0)
    stats.push({ label: "Likes", value: `${formatCompact(profile.totalLikes)}+`, icon: ThumbsUp });
  if (profile.showVideoCount && profile.videoCount > 0)
    stats.push({ label: "Videos", value: `${formatCompact(profile.videoCount)}+`, icon: Film });

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bp-bg)", color: "var(--bp-text)" }}>
      {/* Background — neutral gray with subtle white spotlight at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Cursor-following glow — neutral white */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)",
          transition: "transform 0.15s ease-out",
        }}
      />

      {/* Apple-style liquid glass + animations */}
      <style>{`
        .apple-glass {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 0.5px solid rgba(255,255,255,0.1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .apple-glass:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        @keyframes page-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-enter > * {
          animation: page-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .page-enter > *:nth-child(1) { animation-delay: 0ms; }
        .page-enter > *:nth-child(2) { animation-delay: 80ms; }
        .page-enter > *:nth-child(3) { animation-delay: 160ms; }
        .page-enter > *:nth-child(4) { animation-delay: 240ms; }
        .page-enter > *:nth-child(5) { animation-delay: 320ms; }
        .page-enter > *:nth-child(6) { animation-delay: 400ms; }
        .page-enter > *:nth-child(7) { animation-delay: 480ms; }
        .page-enter > *:nth-child(8) { animation-delay: 560ms; }
        .page-enter > *:nth-child(9) { animation-delay: 640ms; }
        @keyframes dot-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .dot-pulse {
          animation: dot-pulse 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s 1;
        }
        .timeline-line-draw {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, var(--bp-accent), rgba(255,255,255,0.1));
          transform-origin: top;
          animation: line-draw 1s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes line-draw {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .page-enter > *, .dot-pulse, .timeline-line-draw { animation: none !important; }
        }
      `}</style>

      <div className="page-enter relative z-10 mx-auto max-w-2xl px-6 py-12 sm:py-16 flex flex-col gap-12">
        {/* ─── Hero ─── */}
        <header className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar — clean, no gradient ring */}
            <div
              className="w-20 h-20 rounded-full overflow-hidden shrink-0"
              style={{ border: "2px solid rgba(255,255,255,0.1)" }}
            >
              {profile.profileImage ? (
                 
                <img src={profile.profileImage} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-lg font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--bp-text-muted)", background: "var(--bp-surface)" }}
                >
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--bp-text)" }}>
                {profile.displayName}
              </h1>
              {(profile.tagline || profile.bio) && (
                <p className="text-sm mt-0.5" style={{ color: "var(--bp-text-muted)" }}>
                  {profile.tagline || profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Socials — glass pills */}
          {profile.socials.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {profile.socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${GLASS} inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium`}
                  style={{ color: "var(--bp-text)" }}
                >
                  {s.title}
                  {s.handle && <span style={{ color: "var(--bp-text-muted)" }}>{s.handle}</span>}
                  <ExternalLink className="h-3 w-3 opacity-40" />
                </a>
              ))}
            </div>
          )}
        </header>

        {/* ─── Stats ─── */}
        {stats.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "var(--bp-text-muted)" }}>
              Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.map((s) => (
                <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
              ))}
            </div>
          </section>
        )}

        {/* ─── TikTok embed ─── */}
        {profile.tiktokHandle && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "var(--bp-text-muted)" }}>
              TikTok
            </h2>
            <TikTokProfileEmbed handle={profile.tiktokHandle} />
          </section>
        )}

        {/* ─── Milestones ─── */}
        {profile.milestones && profile.milestones.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "var(--bp-text-muted)" }}>
              Milestones
            </h2>
            <MilestoneTimeline milestones={profile.milestones} />
          </section>
        )}

        {/* ─── Videos ─── */}
        {profile.videos.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "var(--bp-text-muted)" }}>
              Popular videos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {profile.videos.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${GLASS} block relative aspect-[9/16] rounded-2xl overflow-hidden`}
                >
                  {v.thumbnail ? (
                     
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-6 w-6" style={{ color: "var(--bp-text-muted)" }} />
                    </div>
                  )}
                  {typeof v.views === "number" && v.views > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white flex items-center gap-0.5">
                      <Play className="h-2 w-2 fill-white" />
                      {formatCompact(v.views)}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ─── Projects ─── */}
        {profile.projects.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "var(--bp-text-muted)" }}>
              Projects
            </h2>
            <div className="flex flex-col gap-2">
              {profile.projects.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${GLASS} block rounded-2xl p-4`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)", color: "var(--bp-text)" }}>
                      {p.title}
                    </h3>
                    <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "var(--bp-text-muted)" }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--bp-text-muted)" }}>{p.description}</p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "var(--bp-text-muted)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ─── About / Achievements ─── */}
        {profile.achievements.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "var(--bp-text-muted)" }}>
              About
            </h2>
            <div className={`${GLASS} rounded-2xl p-4`}>
              <ul className="flex flex-col gap-2.5">
                {profile.achievements.map((a, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--bp-text)" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--bp-accent)" }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ─── Footer ─── */}
        <footer className="pt-6 text-center" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "var(--bp-text-muted)" }}>
            {profile.displayName} · {profile.tiktokHandle && `@${profile.tiktokHandle}`}
          </p>
        </footer>
      </div>

      {/* ─── Login (bottom-left, glass) ─── */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`${GLASS} fixed bottom-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg`}
            style={{ color: "var(--bp-text-muted)" }}
            title="Sign in"
            aria-label="Sign in"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={8} className="w-48 p-1 apple-glass rounded-xl">
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--bp-text-muted)" }}>
            Sign in to
          </div>
          <button
            onClick={() => onLogin("financial")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors duration-100 hover:bg-white/5"
            style={{ color: "var(--bp-text)" }}
          >
            <Wallet className="h-4 w-4 shrink-0" style={{ color: "var(--bp-accent)" }} />
            <div className="flex flex-col items-start">
              <span className="font-medium">Financial</span>
              <span className="text-[10px]" style={{ color: "var(--bp-text-muted)" }}>Promo manager</span>
            </div>
          </button>
          <button
            onClick={() => onLogin("edit")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors duration-100 hover:bg-white/5"
            style={{ color: "var(--bp-text)" }}
          >
            <Pencil className="h-4 w-4 shrink-0" style={{ color: "var(--bp-accent)" }} />
            <div className="flex flex-col items-start">
              <span className="font-medium">Edit page</span>
              <span className="text-[10px]" style={{ color: "var(--bp-text-muted)" }}>Update this bio</span>
            </div>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
