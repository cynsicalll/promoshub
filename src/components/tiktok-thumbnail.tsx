"use client";

import * as React from "react";
import { Video, ExternalLink, Play, Music2 } from "lucide-react";
import { normalizeUrl, domainFromUrl } from "@/lib/format";

interface TikTokThumbnailProps {
  url: string;
  title: string | null;
  soundName?: string | null;
  index?: number;
  fallbackLabel?: string;
  accentColor?: "pink" | "emerald";
  onSoundClick?: (soundName: string) => void;
}

// Extract TikTok video ID directly from URL (for full URLs)
function extractVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  if (m) return m[1];
  return null;
}

interface ResolveResult {
  videoId: string | null;
  cover: string | null;
  title: string | null;
}

export function TikTokThumbnail({
  url,
  title,
  soundName,
  index,
  fallbackLabel,
  accentColor = "pink",
  onSoundClick,
}: TikTokThumbnailProps) {
  // mounted prevents hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  const [resolved, setResolved] = React.useState<ResolveResult | null>(null);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedUrl = normalizeUrl(url);
  const displayTitle = title || resolved?.title || fallbackLabel || `Video ${index ?? 1}`;

  // Fetch thumbnail from our API
  React.useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch(`/api/tiktok-resolve?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data: ResolveResult) => {
        if (!cancelled) setResolved(data);
      })
      .catch(() => {
        if (!cancelled) setResolved({ videoId: null, cover: null, title: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url, mounted]);

  const accentClasses =
    accentColor === "emerald"
      ? "hover:border-emerald-400"
      : "hover:border-pink-400";

  const playButtonBg =
    accentColor === "emerald"
      ? "bg-emerald-500/90"
      : "bg-pink-500/90";

  const soundAccent =
    accentColor === "emerald"
      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
      : "text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30";

  const hasCover = resolved?.cover && !imgError;
  const isFetching = mounted && !resolved;

  return (
    <div
      className={`group block overflow-hidden rounded-lg border bg-muted transition-colors ${accentClasses}`}
    >
      {/* Thumbnail area (9:16 portrait) — clickable to open video */}
      <a
        href={normalizedUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block relative aspect-[9/16] overflow-hidden"
      >
        {hasCover && resolved?.cover ? (
          <>
            {/* Real TikTok thumbnail image */}
            <img
              src={resolved.cover}
              alt={displayTitle}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {/* Loading state */}
            {!imgLoaded && <LoadingCard />}
            {/* Play button overlay */}
            <PlayOverlay playButtonBg={playButtonBg} />
          </>
        ) : isFetching ? (
          <LoadingCard />
        ) : (
          <>
            {/* Gradient fallback card */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative flex h-full w-full flex-col items-center justify-center text-white p-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-2">
                <Video className="h-7 w-7" />
              </div>
              <p className="text-[11px] font-medium text-center opacity-90 line-clamp-2">
                {displayTitle}
              </p>
              <p className="text-[9px] opacity-70 mt-0.5">
                {domainFromUrl(url)}
              </p>
            </div>
            <PlayOverlay playButtonBg={playButtonBg} />
          </>
        )}
      </a>
      {/* Info bar */}
      <div className="p-2 bg-background space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{displayTitle}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {domainFromUrl(url)}
            </p>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
        {/* Sound name — clickable to scroll to sound */}
        {soundName && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSoundClick?.(soundName);
            }}
            className={`flex items-center gap-1 w-full text-left rounded px-1 py-0.5 text-[10px] font-medium transition-colors ${soundAccent}`}
            title={soundName}
          >
            <Music2 className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{soundName}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900">
      <div className="text-center">
        <Video className="h-6 w-6 mx-auto mb-1 text-pink-400/60" />
        <div className="h-3 w-3 mx-auto animate-spin rounded-full border-2 border-pink-300 border-t-pink-500" />
      </div>
    </div>
  );
}

function PlayOverlay({ playButtonBg }: { playButtonBg: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${playButtonBg} text-white shadow-lg transition-transform group-hover:scale-110`}>
        <Play className="h-5 w-5 fill-white" />
      </div>
    </div>
  );
}
