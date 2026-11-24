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
  socials: [{ id: "tiktok", title: "TikTok", url: "https://www.tiktok.com/@sigmadudereal", handle: "@sigmadudereal", icon: "tiktok" }],
  projects: [
    { id: "promos", title: "Promos", description: "Sound promo management system.", url: "/?demo=viewer", tags: ["Next.js", "TypeScript"] },
    { id: "clipvault", title: "ClipVault", description: "Watches Twitch streams 24/7.", url: "https://clipvault.live", tags: ["Twitch", "AI"] },
  ],
  achievements: ["100K+ TikTok followers", "100M+ total views", "17yo entrepreneur & professional yapper", "Passionate skier (mainly park)", "Motocross/Surron rider & mountain biker"],
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
    <div className="liquid-glass rounded-2xl p-3 overflow-hidden flex justify-center min-h-[120px]">
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
        <div className="flex items-center text-xs text-white/40">
          <div className="h-3 w-3 animate-spin rounded-full border border-white/10 border-t-[#e8b339] mr-2" />
          Loading…
        </div>
      )}
    </div>
  );
}

// ─── Magnetic hover wrapper ──────────────────────────────────────────────────
// Subtle cursor-following tilt — one deliberate interaction effect.

function MagneticHover({ children, strength = 0.15 }: { children: React.ReactNode; strength?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState("");

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTransform(`perspective(600px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg)`);
  };

  const reset = () => setTransform("");

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        transform,
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}

// ─── Stat tile with count-up ──────────────────────────────────────────────────

function StatTile({ label, value, icon: Icon, delay }: { label: string; value: string; icon: React.ElementType; delay: number }) {
  return (
    <div
      className="liquid-glass rounded-2xl px-4 py-3 text-center reveal"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-[#e8b339]" />
      <p className="text-xl font-bold tabular-nums text-white" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
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

  // Cursor glow — one ambient effect, follows the mouse
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
    <div className="min-h-screen relative overflow-hidden bg-[#06060a] text-white">
      {/* ─── Background: single radial depth + subtle noise ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(232,179,57,0.06) 0%, transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(120,80,200,0.04) 0%, transparent 70%)",
        }}
      />

      {/* ─── Cursor-following glow (one ambient effect) ─── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(232,179,57,0.08) 0%, transparent 60%)",
          transition: "transform 0.15s ease-out",
        }}
      />

      {/* ─── Animations ─── */}
      <style>{`
        @keyframes reveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal {
          animation: reveal 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .name-shimmer {
          background: linear-gradient(90deg, #fff 0%, #e8b339 50%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s ease-in-out infinite;
        }
        .liquid-glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .liquid-glass:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(232,179,57,0.2);
        }
        .avatar-ring {
          position: relative;
        }
        .avatar-ring::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #e8b339, transparent 70%, #e8b339);
          animation: spin 8s linear infinite;
          opacity: 0.3;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .name-shimmer, .avatar-ring::before { animation: none !important; }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-xl px-5 py-12 sm:py-16 flex flex-col gap-8">
        {/* ─── Hero ─── */}
        <header className="flex flex-col items-center gap-4 reveal">
          {/* Avatar with rotating gold ring */}
          <div className="avatar-ring">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 relative z-10">
              {profile.profileImage ? (
                 
                <img src={profile.profileImage} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight name-shimmer" style={{ fontFamily: "var(--font-display)" }}>
              {profile.displayName}
            </h1>
            {(profile.tagline || profile.bio) && (
              <p className="text-sm text-white/50 mt-1">{profile.tagline || profile.bio}</p>
            )}
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
                  className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-white/90 hover:text-[#e8b339]"
                >
                  {s.title}
                  {s.handle && <span className="text-white/30">{s.handle}</span>}
                  <ExternalLink className="h-3 w-3 opacity-40" />
                </a>
              ))}
            </div>
          )}
        </header>

        {/* ─── Stats ─── */}
        {stats.length > 0 && (
          <section className="reveal" style={{ animationDelay: "100ms" }}>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-2.5 text-center">Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.map((s, i) => (
                <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} delay={150 + i * 50} />
              ))}
            </div>
          </section>
        )}

        {/* ─── TikTok embed ─── */}
        {profile.tiktokHandle && (
          <section className="reveal" style={{ animationDelay: "200ms" }}>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-2.5 text-center">TikTok</h2>
            <TikTokProfileEmbed handle={profile.tiktokHandle} />
          </section>
        )}

        {/* ─── Videos ─── */}
        {profile.videos.length > 0 && (
          <section className="reveal" style={{ animationDelay: "250ms" }}>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-2.5 text-center">Popular videos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {profile.videos.map((v) => (
                <MagneticHover key={v.id} strength={0.1}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-[9/16] rounded-xl overflow-hidden liquid-glass"
                  >
                    {v.thumbnail ? (
                       
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-6 w-6 text-white/20" />
                      </div>
                    )}
                    {typeof v.views === "number" && v.views > 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white flex items-center gap-0.5">
                        <Play className="h-2 w-2 fill-white" />
                        {formatCompact(v.views)}
                      </span>
                    )}
                  </a>
                </MagneticHover>
              ))}
            </div>
          </section>
        )}

        {/* ─── Projects ─── */}
        {profile.projects.length > 0 && (
          <section className="reveal" style={{ animationDelay: "300ms" }}>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-2.5 text-center">Projects</h2>
            <div className="flex flex-col gap-2">
              {profile.projects.map((p, i) => (
                <MagneticHover key={p.id} strength={0.08}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="liquid-glass block rounded-2xl p-4 hover:text-[#e8b339]"
                    style={{ animationDelay: `${350 + i * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-medium text-white" style={{ fontFamily: "var(--font-display)" }}>
                        {p.title}
                      </h3>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/30" />
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">{p.description}</p>
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.tags.map((tag) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                </MagneticHover>
              ))}
            </div>
          </section>
        )}

        {/* ─── About / Achievements ─── */}
        {profile.achievements.length > 0 && (
          <section className="reveal" style={{ animationDelay: "400ms" }}>
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-2.5 text-center">About</h2>
            <div className="liquid-glass rounded-2xl p-4">
              <ul className="flex flex-col gap-2">
                {profile.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm text-white/70 reveal"
                    style={{ animationDelay: `${450 + i * 40}ms` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8b339] shrink-0 shadow-[0_0_6px_rgba(232,179,57,0.6)]" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ─── Footer ─── */}
        <footer className="reveal pt-6 border-t border-white/5 text-center" style={{ animationDelay: "500ms" }}>
          <p className="text-xs text-white/20">
            {profile.displayName} · {profile.tiktokHandle && `@${profile.tiktokHandle}`}
          </p>
        </footer>
      </div>

      {/* ─── Login (bottom-left, glass) ─── */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="fixed bottom-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg liquid-glass text-white/40 hover:text-[#e8b339]"
            title="Sign in"
            aria-label="Sign in"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={8} className="w-48 p-1 liquid-glass border-white/5">
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/30">Sign in to</div>
          <button
            onClick={() => onLogin("financial")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
          >
            <Wallet className="h-4 w-4 text-[#e8b339] shrink-0" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Financial</span>
              <span className="text-[10px] text-white/30">Promo manager</span>
            </div>
          </button>
          <button
            onClick={() => onLogin("edit")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
          >
            <Pencil className="h-4 w-4 text-[#e8b339] shrink-0" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Edit page</span>
              <span className="text-[10px] text-white/30">Update this bio</span>
            </div>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
