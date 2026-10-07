"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import {
  Video, Eye, Heart, MessageCircle, Share2, TrendingUp, Music2,
  BarChart3, ExternalLink, Trophy, RefreshCw, Loader2, Megaphone,
  Plus, Trash2, Play, Clock, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/stat-card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from "recharts";
import { normalizeUrl, domainFromUrl } from "@/lib/format";
import { usePromos, useSounds } from "@/hooks/use-data";

function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// (Sorting is done server-side in /api/channel-stats by real TikTok upload time.)

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface VideoItem {
  id: string;
  url: string;
  title: string | null;
  cover: string | null;
  duration: number | null;
  playCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  soundName: string | null;
  soundArtist: string | null;
  promoName: string | null;
  hasPromo: boolean;
  createdAt: string;
  createTime: number | null; // real TikTok upload timestamp (Unix seconds)
  statsSynced: string | null;
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
  topVideos: VideoItem[];
  soundPerformance: Array<{
    soundName: string; artist: string | null; videoCount: number;
    totalViews: number; totalLikes: number; avgViews: number; avgEngagement: number;
  }>;
  promoPerformance: Array<{
    promoName: string; videoCount: number; totalViews: number; totalLikes: number; avgViews: number;
  }>;
  allVideos: VideoItem[];
  lastSynced: string | null;
}

export function ChannelView() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isDemo = user?.role === "DEMO";
  const [addOpen, setAddOpen] = React.useState(false);

  const { data, isLoading } = useQuery<ChannelData>({
    queryKey: isDemo ? ["demo", "channel"] : ["channel-stats"],
    queryFn: async () => {
      if (isDemo) {
        const res = await fetch("/api/demo-data");
        const d = await res.json();
        const allVids = d.promos.flatMap((p: Record<string, unknown>) =>
          (p.tiktoks as Array<Record<string, unknown>>).map((tt: Record<string, unknown>) => {
            const snd = (p.sounds as Array<Record<string, unknown>>).find(
              (s: Record<string, unknown>) => s.soundId === tt.soundId
            );
            return {
              id: tt.id as string, url: tt.url as string, title: tt.title as string | null,
              cover: null, duration: null,
              playCount: tt.playCount as number | null, likeCount: tt.likeCount as number | null,
              commentCount: tt.commentCount as number | null, shareCount: tt.shareCount as number | null,
              soundName: snd ? ((snd.sound as Record<string, unknown>).name as string) : null,
              soundArtist: snd ? ((snd.sound as Record<string, unknown>).artist as string) : null,
              promoName: p.name as string, hasPromo: true,
              createdAt: tt.createdAt as string, createTime: null, statsSynced: null,
            };
          })
        );
        const withStats = allVids.filter((v: VideoItem) => v.playCount !== null);
        return {
          totalVideos: allVids.length, videosWithStats: withStats.length,
          totalViews: withStats.reduce((s: number, v: VideoItem) => s + (v.playCount || 0), 0),
          totalLikes: withStats.reduce((s: number, v: VideoItem) => s + (v.likeCount || 0), 0),
          totalComments: 0, totalShares: 0,
          avgViews: withStats.length > 0 ? Math.round(withStats.reduce((s: number, v: VideoItem) => s + (v.playCount || 0), 0) / withStats.length) : 0,
          avgLikes: 0,
          topVideos: [...withStats].sort((a: VideoItem, b: VideoItem) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10),
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
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setAddOpen(true)} variant="outline" className="gap-2 border-pink-200 text-pink-600">
                <Plus className="h-4 w-4" /> {t("channel.addVideo")}
              </Button>
              <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {t("stats.sync")}
              </Button>
            </div>
          )}
        </Card>
        {!isDemo && <AddTiktokDialog open={addOpen} onOpenChange={setAddOpen} />}
      </div>
    );
  }

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
          <div className="flex gap-2">
            <Button onClick={() => setAddOpen(true)} variant="outline" className="gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:text-pink-400 dark:hover:bg-pink-950/30">
              <Plus className="h-4 w-4" /> {t("channel.addVideo")}
            </Button>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
              {syncMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("stats.syncing")}</> : <><RefreshCw className="h-4 w-4" /> {t("stats.sync")}</>}
            </Button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.totalViews")} value={formatCount(data.totalViews)} icon={Eye} tone="emerald" />
        <StatCard label={t("stats.avgViews")} value={formatCount(data.avgViews)} icon={TrendingUp} tone="teal" />
        <StatCard label={t("stats.totalLikes")} value={formatCount(data.totalLikes)} icon={Heart} tone="rose" />
        <StatCard label={t("stats.totalVideos")} value={`${data.videosWithStats}/${data.totalVideos}`} icon={Video} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("stats.totalComments")} value={formatCount(data.totalComments)} icon={MessageCircle} tone="slate" />
        <StatCard label={t("stats.totalShares")} value={formatCount(data.totalShares)} icon={Share2} tone="slate" />
        <StatCard label={t("stats.avgLikes")} value={formatCount(data.avgLikes)} icon={Heart} tone="amber" />
      </div>

      {/* Video grid with thumbnails */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Video className="h-4 w-4 text-muted-foreground" />
          {t("channel.allVideos")}
        </h3>
        {(() => {
          // Videos are already sorted by TikTok upload order (oldest first) from the API
          const sortedByDate = data.allVideos
            .filter((v) => v.playCount !== null);
          return (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortedByDate.map((v, i) => (
              <VideoCard key={v.id} video={v} rank={i + 1} isDemo={isDemo} />
            ))}
        </div>
          );
        })()}
      </Card>

      {/* Views chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          {t("channel.viewsPerVideo")}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              // SAME order as the grid: already sorted by TikTok upload order from the API
              const sortedVideos = data.allVideos
                .filter((v) => v.playCount !== null);
              const chartData = sortedVideos.map((v, i) => ({
                label: `V${i + 1}`,
                views: v.playCount || 0,
                likes: v.likeCount || 0,
              }));
              return (
            <BarChart
              data={chartData}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} className="fill-muted-foreground" interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tickLine={false} axisLine={false} fontSize={10} className="fill-muted-foreground" width={40} tickFormatter={(v) => formatCount(v)} />
              <Tooltip formatter={(v: number) => formatCount(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="views" name={t("stats.views")} fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="likes" name={t("stats.likes")} fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
              );
            })()}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sound performance */}
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
                  <TableHead className="text-right w-[100px]">{t("channel.engagement")}</TableHead>
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
                    <TableCell className="text-right tabular-nums">{s.avgEngagement}%</TableCell>
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
                  <TableHead className="text-center w-[90px]">{t("stats.totalVideos")}</TableHead>
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

      {!isDemo && <AddTiktokDialog open={addOpen} onOpenChange={setAddOpen} />}
    </div>
  );
}

// ─── Video Card with thumbnail ─────────────────────────────
function VideoCard({ video, rank, isDemo }: { video: VideoItem; rank: number; isDemo?: boolean }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  // Cover state: try stored cover → fetched cover → fetched originCover → fallback
  const [cover, setCover] = React.useState<string | null>(video.cover || null);
  const [originCover, setOriginCover] = React.useState<string | null>(null);
  const [usingOrigin, setUsingOrigin] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [fetching, setFetching] = React.useState(!video.cover);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const hasCover = (cover || originCover) && !imgError;
  const currentSrc = usingOrigin ? originCover : cover;

  // If no cover stored, fetch it from tiktok-resolve API with retry
  React.useEffect(() => {
    if (video.cover || !video.url.includes("tiktok.com")) {
      setFetching(false);
      return;
    }
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function fetchCover(attempt: number) {
      if (cancelled) return;
      setFetching(true);
      try {
        const res = await fetch(`/api/tiktok-resolve?url=${encodeURIComponent(video.url)}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (cancelled) return;
        if (data.cover) {
          setCover(data.cover);
        }
        if (data.originCover) {
          setOriginCover(data.originCover);
        }
        if (!data.cover && !data.originCover) {
          // No cover from API — retry up to 3 times with backoff
          if (attempt < 3) {
            timeoutId = setTimeout(() => fetchCover(attempt + 1), 2000 * (attempt + 1));
            return;
          }
        }
        setFetching(false);
      } catch {
        if (cancelled) return;
        // Network error — retry up to 3 times
        if (attempt < 3) {
          timeoutId = setTimeout(() => fetchCover(attempt + 1), 2000 * (attempt + 1));
        } else {
          setFetching(false);
        }
      }
    }

    fetchCover(0);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [video.url, video.cover]);

  // Handle image load error: try origin_cover as fallback, then show gradient
  function handleImgError() {
    if (!usingOrigin && originCover) {
      setUsingOrigin(true);
      setImgError(false);
    } else {
      setImgError(true);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tiktoks?id=${video.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("channel.deleteVideoSuccess"));
      qc.invalidateQueries({ queryKey: ["channel-stats"] });
      qc.invalidateQueries({ queryKey: ["tiktok-stats"] });
      qc.invalidateQueries({ queryKey: ["promos"] });
      setDeleteOpen(false);
    } catch {
      toast.error(t("channel.deleteVideoFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="group relative block overflow-hidden rounded-lg border bg-muted transition-colors hover:border-emerald-400">
        {/* Clickable thumbnail — opens video */}
        <a
          href={normalizeUrl(video.url)}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block"
        >
          <div className="relative aspect-[9/16] bg-muted overflow-hidden">
            {hasCover && currentSrc ? (
              <img
                src={currentSrc}
                alt={video.title || `Video ${rank}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={handleImgError}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : fetching ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900">
                <div className="text-center">
                  <Video className="h-6 w-6 mx-auto mb-1 text-pink-400/60" />
                  <div className="h-2.5 w-2.5 mx-auto animate-spin rounded-full border-2 border-pink-300 border-t-pink-500" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center">
                <Video className="h-8 w-8 text-white/60" />
              </div>
            )}
            <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
              {rank}
            </div>
            {video.duration && (
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white backdrop-blur-sm">
                <Clock className="h-2 w-2" />
                {formatDuration(video.duration)}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/90 text-white shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-4 w-4 fill-white" />
              </div>
            </div>
          </div>
        </a>
        {/* Delete button — appears on hover (hidden in demo mode) */}
        {!isDemo && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/90"
            title={t("channel.deleteVideo")}
            aria-label={t("channel.deleteVideo")}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
        {/* Info */}
        <div className="p-2 space-y-1 bg-background">
          <p className="text-xs font-medium truncate">{video.title || `Video ${rank}`}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              {formatCount(video.playCount)}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              {formatCount(video.likeCount)}
            </span>
          </div>
          {video.soundName && (
            <div className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
              <Music2 className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{video.soundName}</span>
            </div>
          )}
          {video.promoName && (
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate">
              <Megaphone className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{video.promoName}</span>
            </div>
          )}
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Calendar className="h-2.5 w-2.5 shrink-0" />
            <span>{(video.createTime ? new Date(video.createTime * 1000) : new Date(video.createdAt)).toLocaleDateString("en", { day: "numeric", month: "short", year: "2-digit" })}</span>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("channel.deleteVideoTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("channel.deleteVideoDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t("channel.deleteVideo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Add TikTok Dialog (paste link, no promo required) ─────
function AddTiktokDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: promos = [] } = usePromos();
  const { data: sounds = [] } = useSounds();
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [soundId, setSoundId] = React.useState("");
  const [promoId, setPromoId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUrl(""); setTitle(""); setSoundId(""); setPromoId("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!url.trim()) {
      toast.error("Please enter a TikTok URL");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tiktoks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || undefined,
          soundId: soundId || undefined,
          promoId: promoId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      toast.success("TikTok added — stats auto-fetched!");
      qc.invalidateQueries({ queryKey: ["channel-stats"] });
      qc.invalidateQueries({ queryKey: ["tiktok-stats"] });
      qc.invalidateQueries({ queryKey: ["promos"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-pink-500" />
            {t("channel.addVideo")}
          </DialogTitle>
          <DialogDescription>{t("channel.addVideoDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tt-url">TikTok URL *</Label>
            <Input
              id="tt-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/… or vm.tiktok.com/…"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
            <p className="text-xs text-muted-foreground">Stats (views, likes, thumbnail) are auto-fetched.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tt-title">Title (optional)</Label>
            <Input
              id="tt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spot 1 – Beach"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("channel.linkPromo")}</Label>
              <Select value={promoId} onValueChange={(v) => setPromoId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No promo —</SelectItem>
                  {promos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("channel.linkSound")}</Label>
              <Select value={soundId} onValueChange={(v) => setSoundId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No sound —</SelectItem>
                  {sounds.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("action.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={saving || !url.trim()} className="gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> {t("channel.addVideo")}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
