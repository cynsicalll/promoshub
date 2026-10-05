"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import {
  Video, Eye, Heart, MessageCircle, Share2, TrendingUp, Music2,
  BarChart3, ExternalLink, Trophy, RefreshCw, Loader2, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/stat-card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeUrl, domainFromUrl } from "@/lib/format";

function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface ChannelData {
  totalVideos: number;
  videosWithStats: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgViews: number;
  avgLikes: number;
  topVideos: Array<{
    id: string; url: string; title: string | null;
    playCount: number | null; likeCount: number | null;
    commentCount: number | null; shareCount: number | null;
    soundName: string | null; promoName: string | null; createdAt: string;
  }>;
  soundPerformance: Array<{
    soundName: string; artist: string | null; videoCount: number;
    totalViews: number; totalLikes: number; avgViews: number; avgEngagement: number;
  }>;
  promoPerformance: Array<{
    promoName: string; videoCount: number; totalViews: number; totalLikes: number; avgViews: number;
  }>;
  allVideos: Array<{
    id: string; url: string; title: string | null;
    playCount: number | null; likeCount: number | null;
    commentCount: number | null; shareCount: number | null;
    soundName: string | null; promoName: string | null; createdAt: string;
  }>;
  lastSynced: string | null;
}

export function ChannelView() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isDemo = user?.role === "DEMO";

  const { data, isLoading } = useQuery<ChannelData>({
    queryKey: isDemo ? ["demo", "channel"] : ["channel-stats"],
    queryFn: async () => {
      if (isDemo) {
        const res = await fetch("/api/demo-data");
        const d = await res.json();
        // Build channel data from demo promos
        const allVids = d.promos.flatMap((p: Record<string, unknown>) =>
          (p.tiktoks as Array<Record<string, unknown>>).map((tt: Record<string, unknown>) => {
            const snd = (p.sounds as Array<Record<string, unknown>>).find(
              (s: Record<string, unknown>) => s.soundId === tt.soundId
            );
            return {
              id: tt.id as string, url: tt.url as string, title: tt.title as string | null,
              playCount: tt.playCount as number | null, likeCount: tt.likeCount as number | null,
              commentCount: tt.commentCount as number | null, shareCount: tt.shareCount as number | null,
              soundName: snd ? ((snd.sound as Record<string, unknown>).name as string) : null,
              promoName: p.name as string, createdAt: tt.createdAt as string,
            };
          })
        );
        const withStats = allVids.filter((v: { playCount: number | null }) => v.playCount !== null);
        return {
          totalVideos: allVids.length,
          videosWithStats: withStats.length,
          totalViews: withStats.reduce((s: number, v: { playCount: number | null }) => s + (v.playCount || 0), 0),
          totalLikes: withStats.reduce((s: number, v: { likeCount: number | null }) => s + (v.likeCount || 0), 0),
          totalComments: withStats.reduce((s: number, v: { commentCount: number | null }) => s + (v.commentCount || 0), 0),
          totalShares: withStats.reduce((s: number, v: { shareCount: number | null }) => s + (v.shareCount || 0), 0),
          avgViews: withStats.length > 0 ? Math.round(withStats.reduce((s: number, v: { playCount: number | null }) => s + (v.playCount || 0), 0) / withStats.length) : 0,
          avgLikes: withStats.length > 0 ? Math.round(withStats.reduce((s: number, v: { likeCount: number | null }) => s + (v.likeCount || 0), 0) / withStats.length) : 0,
          topVideos: [...withStats].sort((a: { playCount: number | null }, b: { playCount: number | null }) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10),
          soundPerformance: [], promoPerformance: [], allVideos: allVids, lastSynced: null,
        } as ChannelData;
      }
      const res = await fetch("/api/channel-stats");
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channel-stats"] });
      qc.invalidateQueries({ queryKey: ["tiktok-stats"] });
      toast.success("Stats synced");
    },
    onError: () => toast.error("Sync failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.videosWithStats === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          {t("channel.title")}
        </h1>
        <Card className="p-10 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">{t("channel.noStats")}</p>
          {!isDemo && (
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t("stats.sync")}
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const soundColors = ["#10b981", "#0d9488", "#f59e0b", "#f43f5e", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            {t("channel.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("channel.subtitle")}</p>
        </div>
        {!isDemo && (
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
            {syncMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("stats.syncing")}</> : <><RefreshCw className="h-4 w-4" /> {t("stats.sync")}</>}
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.totalViews")} value={formatCount(data.totalViews)} icon={Eye} tone="emerald" />
        <StatCard label={t("stats.avgViews")} value={formatCount(data.avgViews)} icon={TrendingUp} tone="teal" />
        <StatCard label={t("stats.totalLikes")} value={formatCount(data.totalLikes)} icon={Heart} tone="rose" />
        <StatCard label={t("stats.totalVideos")} value={`${data.videosWithStats}/${data.totalVideos}`} icon={Video} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("stats.totalComments")} value={formatCount(data.totalComments)} icon={MessageCircle} tone="slate" />
        <StatCard label={t("stats.totalShares")} value={formatCount(data.totalShares)} icon={Share2} tone="slate" />
        <StatCard label={t("stats.avgLikes")} value={formatCount(data.avgLikes)} icon={Heart} tone="amber" />
      </div>

      {/* Views chart per video */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          {t("channel.viewsPerVideo")}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.allVideos.filter(v => v.playCount).map((v, i) => ({ label: v.title || `Video ${i+1}`, views: v.playCount || 0, likes: v.likeCount || 0 }))} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} className="fill-muted-foreground" interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tickLine={false} axisLine={false} fontSize={10} className="fill-muted-foreground" width={40} tickFormatter={(v) => formatCount(v)} />
              <Tooltip formatter={(v: number) => formatCount(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="views" name={t("stats.views")} fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="likes" name={t("stats.likes")} fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sound performance analysis */}
      {data.soundPerformance.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Music2 className="h-4 w-4 text-emerald-500" />
              {t("channel.soundAnalysis")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[160px]">{t("sounds.col.sound")}</TableHead>
                  <TableHead className="text-center w-[80px]">{t("stats.totalVideos")}</TableHead>
                  <TableHead className="text-right w-[100px]">{t("stats.totalViews")}</TableHead>
                  <TableHead className="text-right w-[100px]">{t("stats.avgViews")}</TableHead>
                  <TableHead className="text-right w-[100px]">{t("stats.totalLikes")}</TableHead>
                  <TableHead className="text-right w-[100px]">{t("channel.engagement")}</TableHead>
                  <TableHead className="w-[120px]">{t("stats.col.avgViews")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.soundPerformance.map((s, i) => (
                  <TableRow key={s.soundName} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <div>
                          <p className="text-sm">{s.soundName}</p>
                          {s.artist && <p className="text-xs text-muted-foreground">{s.artist}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{s.videoCount}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCount(s.totalViews)}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCount(s.avgViews)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(s.totalLikes)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.avgEngagement}%</TableCell>
                    <TableCell>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (s.avgViews / (data.soundPerformance[0]?.avgViews || 1)) * 100)}%` }} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Promo performance */}
      {data.promoPerformance.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              {t("channel.promoAnalysis")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[180px]">{t("stats.col.promo")}</TableHead>
                  <TableHead className="text-center w-[80px]">{t("stats.totalVideos")}</TableHead>
                  <TableHead className="text-right w-[120px]">{t("stats.totalViews")}</TableHead>
                  <TableHead className="text-right w-[120px]">{t("stats.totalLikes")}</TableHead>
                  <TableHead className="text-right w-[120px]">{t("stats.col.avgViews")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.promoPerformance.map((p) => (
                  <TableRow key={p.promoName} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-sm">{p.promoName}</TableCell>
                    <TableCell className="text-center tabular-nums">{p.videoCount}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCount(p.totalViews)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(p.totalLikes)}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCount(p.avgViews)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* All videos table */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            {t("channel.allVideos")}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[200px]">{t("stats.col.video")}</TableHead>
                <TableHead className="min-w-[140px]">{t("sounds.col.sound")}</TableHead>
                <TableHead className="min-w-[140px]">{t("stats.col.promo")}</TableHead>
                <TableHead className="text-right w-[90px]">{t("stats.col.views")}</TableHead>
                <TableHead className="text-right w-[90px]">{t("stats.col.likes")}</TableHead>
                <TableHead className="text-right w-[90px]">{t("stats.col.comments")}</TableHead>
                <TableHead className="text-right w-[90px]">{t("stats.col.shares")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.allVideos.filter(v => v.playCount).sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).map((v, i) => (
                <TableRow key={v.id} className="hover:bg-muted/40">
                  <TableCell>
                    <a href={normalizeUrl(v.url)} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 group">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-muted text-muted-foreground">{i + 1}</span>
                      <span className="text-sm font-medium truncate group-hover:underline">{v.title || `Video ${i + 1}`}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
                    </a>
                  </TableCell>
                  <TableCell>
                    {v.soundName ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Music2 className="h-2.5 w-2.5" />
                        {v.soundName}
                      </Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{v.promoName || "—"}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCount(v.playCount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(v.likeCount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(v.commentCount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(v.shareCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
