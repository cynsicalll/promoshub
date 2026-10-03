"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/components/language-provider";
import {
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  RefreshCw,
  Loader2,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, normalizeUrl, domainFromUrl } from "@/lib/format";
import { StatCard } from "@/components/stat-card";

function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface StatsData {
  totalVideos: number;
  videosWithStats: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgViews: number;
  avgLikes: number;
  topVideos: {
    id: string;
    url: string;
    title: string | null;
    playCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
    shareCount: number | null;
    promoName: string;
    createdAt: string;
  }[];
  promoBreakdown: {
    promoId: string;
    promoName: string;
    videoCount: number;
    totalViews: number;
    totalLikes: number;
    avgViews: number;
  }[];
  lastSynced: string | null;
}

export function StatsView() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["tiktok-stats"],
    queryFn: async () => {
      const res = await fetch("/api/tiktok-stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tiktok-stats", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tiktok-stats"] });
      qc.invalidateQueries({ queryKey: ["promos"] });
      toast.success(
        t("stats.syncSuccess", { updated: data.updated, failed: data.failed })
      );
    },
    onError: () => toast.error(t("stats.syncFailed")),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const hasStats = data.videosWithStats > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            {t("stats.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("stats.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="gap-2"
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("stats.syncing")}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {t("stats.sync")}
            </>
          )}
        </Button>
      </div>

      {/* Last synced info */}
      <p className="text-xs text-muted-foreground">
        {data.lastSynced
          ? t("stats.lastSynced", { date: formatDate(data.lastSynced) })
          : t("stats.neverSynced")}
      </p>

      {!hasStats ? (
        <Card className="p-10 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("stats.noStats")}</p>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("stats.totalViews")}
              value={formatCount(data.totalViews)}
              icon={Eye}
              tone="emerald"
            />
            <StatCard
              label={t("stats.avgViews")}
              value={formatCount(data.avgViews)}
              icon={TrendingUp}
              tone="teal"
            />
            <StatCard
              label={t("stats.totalLikes")}
              value={formatCount(data.totalLikes)}
              icon={Heart}
              tone="rose"
            />
            <StatCard
              label={t("stats.totalVideos")}
              value={`${data.videosWithStats}/${data.totalVideos}`}
              icon={Video}
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label={t("stats.totalComments")}
              value={formatCount(data.totalComments)}
              icon={MessageCircle}
              tone="slate"
            />
            <StatCard
              label={t("stats.totalShares")}
              value={formatCount(data.totalShares)}
              icon={Share2}
              tone="slate"
            />
            <StatCard
              label={t("stats.avgLikes")}
              value={formatCount(data.avgLikes)}
              icon={Heart}
              tone="amber"
            />
          </div>

          {/* Top Videos */}
          <Card className="overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                {t("stats.topVideos")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[200px]">{t("stats.col.video")}</TableHead>
                    <TableHead className="min-w-[140px]">{t("stats.col.promo")}</TableHead>
                    <TableHead className="text-right w-[100px]">{t("stats.col.views")}</TableHead>
                    <TableHead className="text-right w-[100px]">{t("stats.col.likes")}</TableHead>
                    <TableHead className="text-right w-[100px]">{t("stats.col.comments")}</TableHead>
                    <TableHead className="text-right w-[100px]">{t("stats.col.shares")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topVideos.map((v, i) => (
                    <TableRow key={v.id} className="hover:bg-muted/40">
                      <TableCell>
                        <a
                          href={normalizeUrl(v.url)}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="flex items-center gap-2 group"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold bg-muted text-muted-foreground">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate group-hover:underline">
                              {v.title || `Video ${i + 1}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {domainFromUrl(v.url)}
                            </p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {v.promoName}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCount(v.playCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(v.likeCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(v.commentCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(v.shareCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Per-promo breakdown */}
          <Card className="overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                {t("stats.promoBreakdown")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[180px]">{t("stats.col.promo")}</TableHead>
                    <TableHead className="text-center w-[90px]">{t("stats.totalVideos")}</TableHead>
                    <TableHead className="text-right w-[120px]">{t("stats.col.views")}</TableHead>
                    <TableHead className="text-right w-[120px]">{t("stats.col.likes")}</TableHead>
                    <TableHead className="text-right w-[120px]">{t("stats.col.avgViews")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.promoBreakdown.map((p) => (
                    <TableRow key={p.promoId} className="hover:bg-muted/40">
                      <TableCell className="font-medium text-sm">
                        {p.promoName}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {p.videoCount}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCount(p.totalViews)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(p.totalLikes)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCount(p.avgViews)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
