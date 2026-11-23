"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { AudioLines, Lock, ExternalLink, Music2, Video, Trophy, Heart, Sparkles, ArrowUpRight } from "lucide-react";
import { useTheme } from "next-themes";

interface BioLink {
  title: string;
  url: string;
  description?: string;
  icon?: string;
}

interface Project {
  title: string;
  description: string;
  url?: string;
  tags?: string[];
}

export function BioPage({ onLogin }: { onLogin: () => void }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const socials: BioLink[] = [
    { title: "TikTok", url: "https://www.tiktok.com/@sigmadude.6767", description: "@sigmadude.6767", icon: "tiktok" },
  ];

  const projects: Project[] = [
    {
      title: "Promos",
      description: "Sound promo management system — manage promos, payments, customers & TikTok analytics.",
      url: "https://sigmadude.vercel.app",
      tags: ["Next.js", "TypeScript", "Prisma", "TikTok API"],
    },
  ];

  const achievements: string[] = [
    "Managing 15+ active promo campaigns",
    "33+ TikTok videos tracked with analytics",
    "1,000+€ in tracked payments",
    "Custom PWA with push notifications",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-600 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8 sm:py-12">
        {/* Avatar / Name */}
        <div className="flex flex-col items-center gap-4 mb-12 mt-8">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 p-1 shadow-2xl shadow-indigo-500/30">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                <AudioLines className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Cynsical
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-md">
              Sound producer · TikTok creator · Building cool things on the web
            </p>
          </div>
        </div>

        {/* Socials */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {socials.map((s) => (
            <a
              key={s.title}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <span className="text-sm font-medium">{s.title}</span>
              <span className="text-xs text-zinc-400">{s.description}</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
            </a>
          ))}
        </div>

        {/* Projects */}
        <div className="w-full max-w-2xl space-y-4 mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
            <Video className="h-3.5 w-3.5" />
            Projects
          </h2>
          {projects.map((p) => (
            <a
              key={p.title}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-indigo-400/50 hover:bg-white/[0.08] transition-all p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-2">{p.description}</p>
                  {p.tags && (
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

        {/* Achievements */}
        <div className="w-full max-w-2xl space-y-3 mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5" />
            Achievements
          </h2>
          {achievements.map((a, i) => (
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

        {/* TikTok stats preview */}
        <div className="w-full max-w-2xl mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
            <Music2 className="h-3.5 w-3.5" />
            TikTok Stats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-white">33+</p>
              <p className="text-xs text-zinc-400 mt-1">Videos</p>
            </div>
            <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">100K+</p>
              <p className="text-xs text-zinc-400 mt-1">Total Views</p>
            </div>
            <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-rose-400">15K+</p>
              <p className="text-xs text-zinc-400 mt-1">Total Likes</p>
            </div>
          </div>
        </div>

        {/* Made with love */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-4">
          <span>Built with</span>
          <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
          <span>by Cynsical</span>
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
