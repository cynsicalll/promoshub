"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { formatDate, normalizeUrl, domainFromUrl } from "@/lib/format";

export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [promos, setPromos] = React.useState<ShareData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch("/api/my-promos")
      .then((r) => r.json())
      .then((data) => {
        setPromos(data.promos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
              <p className="text-sm font-semibold tracking-tight">PromoHub</p>
              <p className="text-[11px] text-muted-foreground">
                {user?.displayName || user?.username}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Abmelden
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Willkommen, {user?.displayName || user?.username}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hier sehen Sie den Status Ihrer Promos, Sounds und TikTok-Videos.
          </p>
        </div>

        {loading ? (
          <Card className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
            <p className="mt-3 text-sm text-muted-foreground">Lade…</p>
          </Card>
        ) : promos.length === 0 ? (
          <Card className="p-10 text-center">
            <Music2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Ihnen sind aktuell keine Promos zugewiesen.
            </p>
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
                            Sounds
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
                            TikToks
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
                          Sound-Details
                        </h3>
                        {promo.sounds.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Keine Sounds zugeordnet.
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
                                  className="rounded-lg border p-3 space-y-1.5"
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
                                      verwendet
                                    </span>
                                    <span
                                      className={
                                        done
                                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {s.quantityRemaining} übrig
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
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          TikTok-Videos
                        </h3>
                        {promo.tiktoks.length === 0 ? (
                          <div className="text-center py-4">
                            <Video className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                              Noch keine Videos veröffentlicht.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {promo.tiktoks.map((t, i) => (
                              <a
                                key={i}
                                href={normalizeUrl(t.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 rounded-lg border p-3 hover:border-pink-400 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 transition-colors"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
                                  <Video className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">
                                    {t.title || `Video ${i + 1}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {domainFromUrl(t.url)}
                                  </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-pink-600 shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {promo.notes && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-sm font-semibold mb-1">
                              Notizen
                            </h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {promo.notes}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t mt-10 py-4 text-center text-xs text-muted-foreground">
        PromoHub · Kunden-Ansicht
      </footer>
    </div>
  );
}
