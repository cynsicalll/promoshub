"use client";

import * as React from "react";
import { useShare } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromoStatusBadge } from "@/components/status-badges";
import {
  AudioLines,
  Music2,
  Video,
  ExternalLink,
  Link2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  ArrowLeft,
} from "lucide-react";
import type { ShareData } from "@/lib/types";
import { formatDate, normalizeUrl, domainFromUrl } from "@/lib/format";
import Link from "next/link";
import { useI18n } from "@/components/language-provider";

export function ShareView({ code }: { code: string }) {
  const { t } = useI18n();
  const { data, isLoading, error } = useShare(code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Brand header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <AudioLines className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">{t("app.name")}</p>
              <p className="text-[11px] text-muted-foreground">
                {t("share.customerView")}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 bg-background/60 backdrop-blur"
          >
            <Lock className="h-3 w-3" />
            {t("share.protected")}
          </Badge>
        </header>

        {isLoading ? (
          <Card className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-500" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("share.loading")}
            </p>
          </Card>
        ) : error ? (
          <Card className="p-10 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-rose-500" />
            <h1 className="text-lg font-semibold mb-1">{t("share.accessDenied")}</h1>
            <p className="text-sm text-muted-foreground mb-5">
              {t("share.accessDeniedDesc")}
            </p>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> {t("share.toHomepage")}
              </Button>
            </Link>
          </Card>
        ) : data ? (
          <ShareContent data={data} />
        ) : null}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          {t("share.footer")}
        </footer>
      </div>
    </div>
  );
}

function ShareContent({
  data,
}: {
  data: import("@/lib/types").ShareData;
}) {
  const { t } = useI18n();
  const tiktokDone = data.tiktoks.length;
  const tiktokTarget = data.tiktokTarget || 0;
  const tiktokPct =
    tiktokTarget > 0 ? Math.min(100, (tiktokDone / tiktokTarget) * 100) : 0;

  const soundsRemaining = data.sounds.reduce(
    (s, x) => s + x.quantityRemaining,
    0
  );
  const soundsTotal = data.sounds.reduce((s, x) => s + x.quantityTotal, 0);
  const soundsUsed = data.sounds.reduce((s, x) => s + x.quantityUsed, 0);
  const soundsPct =
    soundsTotal > 0 ? Math.min(100, (soundsUsed / soundsTotal) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Title card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(data.date)}
              </span>
              {data.customerName && (
                <span>
                  {data.customerName}
                  {data.customerCompany ? ` · ${data.customerCompany}` : ""}
                </span>
              )}
            </p>
          </div>
          <PromoStatusBadge status={data.status} />
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Sounds KPI */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Music2 className="h-4 w-4" />
            </div>
            <h2 className="font-semibold">{t("share.sounds")}</h2>
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {soundsUsed}
                <span className="text-lg text-muted-foreground">
                  /{soundsTotal}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{t("share.used")}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {soundsRemaining}
              </p>
              <p className="text-xs text-muted-foreground">{t("share.left")}</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
              style={{ width: `${soundsPct}%` }}
            />
          </div>
        </Card>

        {/* TikTok KPI */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
              <Video className="h-4 w-4" />
            </div>
            <h2 className="font-semibold">{t("share.tiktoks")}</h2>
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {tiktokDone}
                <span className="text-lg text-muted-foreground">
                  /{tiktokTarget}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{t("share.createdDone")}</p>
            </div>
            <div className="text-right">
              {tiktokDone >= tiktokTarget && tiktokTarget > 0 ? (
                <p className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> {t("share.done")}
                </p>
              ) : (
                <p className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" /> {tiktokTarget - tiktokDone}{" "}
                  {t("share.open2")}
                </p>
              )}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
              style={{ width: `${tiktokPct}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Sounds list with links */}
      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Music2 className="h-4 w-4 text-muted-foreground" />{" "}
          {t("share.soundDetails")}
        </h2>
        {data.sounds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {t("share.noSounds")}
          </p>
        ) : (
          <div className="space-y-3">
            {data.sounds.map((s, i) => {
              const pct =
                s.quantityTotal > 0
                  ? Math.min(100, (s.quantityUsed / s.quantityTotal) * 100)
                  : 0;
              const done = s.quantityUsed >= s.quantityTotal;
              return (
                <div
                  key={i}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.artist || "—"}
                      </p>
                    </div>
                    {s.url ? (
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
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="tabular-nums">
                      {s.quantityUsed} / {s.quantityTotal}{" "}
                      {t("share.used")}
                    </span>
                    <span
                      className={
                        done
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {s.quantityRemaining} {t("share.left")}
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
      </Card>

      {/* TikToks list */}
      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Video className="h-4 w-4 text-muted-foreground" />{" "}
          {t("share.tiktokVideos")}
        </h2>
        {data.tiktoks.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("share.noTiktoks")}
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.tiktoks.map((tt, i) => (
              <a
                key={i}
                href={normalizeUrl(tt.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg border p-3 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
                  <Video className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {tt.title || t("share.videoNum", { n: i + 1 })}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {domainFromUrl(tt.url)}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
