"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromoStatusBadge } from "@/components/status-badges";
import type { ShareData } from "@/lib/types";
import {
  AudioLines,
  Music2,
  Video,
  ExternalLink,
  Link2,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { formatDate, normalizeUrl, domainFromUrl } from "@/lib/format";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { TikTokThumbnail } from "@/components/tiktok-thumbnail";

// Format large numbers (e.g. 1200 -> 1.2K, 1500000 -> 1.5M)
function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function CustomerDashboard({ token, demoMode }: { token?: string; demoMode?: boolean } = {}) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [promos, setPromos] = React.useState<ShareData[]>([]);
  const [displayName, setDisplayName] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (demoMode) {
      // Load demo data and map to ShareData format
      fetch("/api/demo-data")
        .then((r) => r.json())
        .then((data) => {
          const demoPromos: ShareData[] = (data.promos || []).map((p: Record<string, unknown>) => {
            const sounds = (p.sounds as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => {
              const snd = s.sound as Record<string, unknown>;
              const qt = s.quantityTotal as number;
              const qu = s.quantityUsed as number;
              return {
                name: snd.name as string,
                artist: (snd.artist as string) || null,
                url: (snd.url as string) || null,
                quantityTotal: qt,
                quantityUsed: qu,
                quantityRemaining: qt - qu,
              };
            });
            const tiktoks = (p.tiktoks as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => {
              const snd = p.sounds
                ? (p.sounds as Array<Record<string, unknown>>).find(
                    (s: Record<string, unknown>) => s.soundId === t.soundId
                  )
                : null;
              return {
                url: t.url as string,
                title: (t.title as string) || null,
                soundName: snd ? ((snd.sound as Record<string, unknown>).name as string) : null,
                playCount: (t.playCount as number) ?? null,
                likeCount: (t.likeCount as number) ?? null,
                createdAt: t.createdAt as string,
              };
            });
            const cust = p.customer as Record<string, unknown> | null;
            return {
              name: p.name as string,
              customerName: cust?.name ? (cust.name as string) : null,
              customerCompany: cust?.company ? (cust.company as string) : null,
              date: p.date as string,
              status: p.status as ShareData["status"],
              notes: (p.notes as string) || null,
              tiktokTarget: p.tiktokTarget as number,
              tiktokDone: tiktoks.length,
              sounds,
              tiktoks,
            };
          });
          setPromos(demoPromos);
          setDisplayName("Demo Customer (Nike)");
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load demo data");
          setLoading(false);
        });
      return;
    }

    const url = token
      ? `/api/customer-link/${encodeURIComponent(token)}`
      : "/api/my-promos";
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || "Failed to load");
        }
        return r.json();
      })
      .then((data) => {
        setPromos(data.promos || []);
        setDisplayName(
          token ? data.user?.displayName || data.user?.username || "" : user?.displayName || user?.username || ""
        );
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token, user, demoMode]);

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Scroll to a sound card by its element ID and highlight it
  function scrollToSound(promoIdx: number, soundIdx: number) {
    const el = document.getElementById(`sound-${promoIdx}-${soundIdx}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-emerald-400", "bg-emerald-50/50", "dark:bg-emerald-950/20");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-emerald-400", "bg-emerald-50/50", "dark:bg-emerald-950/20");
    }, 2000);
  }

  // Find sound index by name within a promo and scroll to it
  function handleSoundClick(promoIdx: number, soundName: string) {
    const promo = promos[promoIdx];
    if (!promo) return;
    const soundIdx = promo.sounds.findIndex((s) => s.name === soundName);
    if (soundIdx >= 0) scrollToSound(promoIdx, soundIdx);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/40 dark:from-emerald-950/10 dark:via-background dark:to-teal-950/10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <AudioLines className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">{t("app.name")}</p>
              <p className="text-[11px] text-muted-foreground">
                {displayName || user?.displayName || user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {demoMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const event = new CustomEvent("demo-customer-close");
                  window.dispatchEvent(event);
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Admin
              </Button>
            ) : !token && user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" /> {t("customer.logout")}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        {error ? (
          <Card className="p-10 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-rose-500" />
            <p className="text-sm text-muted-foreground">
              {t("share.accessDenied")}
            </p>
          </Card>
        ) : (
        <>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("customer.welcome", {
              name: displayName || user?.displayName || user?.username || "",
            })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("customer.subtitle")}
          </p>
        </div>

        {loading ? (
          <Card className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
            <p className="mt-3 text-sm text-muted-foreground">{t("action.loading")}</p>
          </Card>
        ) : promos.length === 0 ? (
          <Card className="p-10 text-center">
            <Music2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t("customer.noPromos")}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {promos.map((promo, idx) => {
              const key = `${idx}-${promo.name}`;
              const isExpanded = expanded.has(key);
              const tiktokDone = promo.tiktoks.length;
              const tiktokTarget = promo.tiktokTarget || 0;
              const tiktokPct =
                tiktokTarget > 0
                  ? Math.min(100, (tiktokDone / tiktokTarget) * 100)
                  : 0;
              const soundsTotal = promo.sounds.reduce(
                (s, x) => s + x.quantityTotal,
                0
              );
              const soundsUsed = promo.sounds.reduce(
                (s, x) => s + x.quantityUsed,
                0
              );
              const soundsRemaining = promo.sounds.reduce(
                (s, x) => s + x.quantityRemaining,
                0
              );
              const soundsPct =
                soundsTotal > 0
                  ? Math.min(100, (soundsUsed / soundsTotal) * 100)
                  : 0;

              return (
                <Card key={key} className="overflow-hidden">
                  {/* Promo header (clickable to expand) */}
                  <button
                    onClick={() => toggleExpand(key)}
                    className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-semibold tracking-tight">
                            {promo.name}
                          </h2>
                          <PromoStatusBadge status={promo.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(promo.date)}
                          </span>
                          {promo.customerName && (
                            <span>
                              {promo.customerName}
                              {promo.customerCompany
                                ? ` · ${promo.customerCompany}`
                                : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    {/* Mini KPIs always visible */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Music2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("customer.sounds")}
                          </span>
                        </div>
                        <p className="text-xl font-bold tabular-nums">
                          {soundsUsed}
                          <span className="text-sm text-muted-foreground">
                            /{soundsTotal}
                          </span>
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${soundsPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Video className="h-3.5 w-3.5 text-pink-600" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("customer.tiktoks")}
                          </span>
                        </div>
                        <p className="text-xl font-bold tabular-nums">
                          {tiktokDone}
                          <span className="text-sm text-muted-foreground">
                            /{tiktokTarget}
                          </span>
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-pink-500 rounded-full"
                            style={{ width: `${tiktokPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 space-y-4 bg-muted/10">
                      {/* Sounds detail */}
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Music2 className="h-4 w-4 text-muted-foreground" />
                          {t("customer.soundDetails")}
                        </h3>
                        {promo.sounds.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {t("customer.noSounds")}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {promo.sounds.map((s, i) => {
                              const pct =
                                s.quantityTotal > 0
                                  ? Math.min(
                                      100,
                                      (s.quantityUsed / s.quantityTotal) * 100
                                    )
                                  : 0;
                              const done =
                                s.quantityUsed >= s.quantityTotal;
                              return (
                                <div
                                  key={i}
                                  id={`sound-${idx}-${i}`}
                                  className="rounded-lg border p-3 space-y-1.5 transition-all duration-300"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {s.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {s.artist || "—"}
                                      </p>
                                    </div>
                                    {s.url && (
                                      <a
                                        href={normalizeUrl(s.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                                      >
                                        <Link2 className="h-3.5 w-3.5" />
                                        {domainFromUrl(s.url)}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="tabular-nums">
                                      {s.quantityUsed} / {s.quantityTotal}{" "}
                                      {t("customer.used2")}
                                    </span>
                                    <span
                                      className={
                                        done
                                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {s.quantityRemaining} {t("customer.left")}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        done ? "bg-teal-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* TikToks */}
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 flex-wrap">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          {t("customer.tiktokVideos")}
                          {(() => {
                            const withViews = promo.tiktoks.filter((tt) => tt.playCount != null);
                            if (withViews.length === 0) return null;
                            const totalViews = withViews.reduce((s, tt) => s + (tt.playCount || 0), 0);
                            const avgViews = Math.round(totalViews / withViews.length);
                            const totalLikes = withViews.reduce((s, tt) => s + (tt.likeCount || 0), 0);
                            return (
                              <span className="text-xs font-normal text-muted-foreground flex items-center gap-2">
                                <span className="flex items-center gap-0.5">
                                  <Eye className="h-3 w-3" />
                                  {t("stats.avgViews")}: {formatCount(avgViews)}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Heart className="h-3 w-3" />
                                  {t("stats.totalLikes")}: {formatCount(totalLikes)}
                                </span>
                              </span>
                            );
                          })()}
                        </h3>
                        {promo.tiktoks.length === 0 ? (
                          <div className="text-center py-4">
                            <Video className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                              {t("customer.noTiktoks")}
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                            {promo.tiktoks.map((tt, i) => (
                              <TikTokThumbnail
                                key={i}
                                url={tt.url}
                                title={tt.title}
                                soundName={tt.soundName}
                                playCount={tt.playCount}
                                likeCount={tt.likeCount}
                                index={i + 1}
                                fallbackLabel={t("share.videoNum", { n: i + 1 })}
                                accentColor="pink"
                                onSoundClick={(name) => handleSoundClick(idx, name)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>

      <footer className="border-t mt-10 py-4 text-center text-xs text-muted-foreground">
        {t("app.name")} · {t("customer.customerView")}
      </footer>
    </div>
  );
}
