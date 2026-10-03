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

// Extract TikTok video ID from URL
function extractVideoId(url: string): string | null {
  // Match /video/{id} pattern
  const m = url.match(/\/video\/(\d+)/);
  if (m) return m[1];
  return null;
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
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const videoId = extractVideoId(url);
  const normalizedUrl = normalizeUrl(url);
  const displayTitle = title || fallbackLabel || `Video ${index ?? 1}`;

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

  return (
    <div
      className={`group block overflow-hidden rounded-lg border bg-muted transition-colors ${accentClasses}`}
    >
      {/* Thumbnail area (9:16 portrait for TikTok) — clickable to open video */}
      <a
        href={normalizedUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block relative aspect-[9/16] bg-muted overflow-hidden"
      >
        {videoId ? (
          <>
            {/* TikTok embed iframe as thumbnail */}
            <div className="absolute inset-0 pointer-events-none">
              <iframe
                src={`https://www.tiktok.com/embed/v2/${videoId}`}
                className="w-full h-full"
                style={{ border: "none", pointerEvents: "none" }}
                scrolling="no"
                allow="autoplay; encrypted-media"
                title={displayTitle}
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
              />
            </div>
            {/* Loading state */}
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900">
                <div className="text-center">
                  <Video className="h-6 w-6 mx-auto mb-1 text-pink-400/60" />
                  <div className="h-3 w-3 mx-auto animate-spin rounded-full border-2 border-pink-300 border-t-pink-500" />
                </div>
              </div>
            )}
            {/* Click overlay with play button */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${playButtonBg} text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110`}>
                <Play className="h-5 w-5 fill-white" />
              </div>
            </div>
          </>
        ) : (
          // Fallback for non-TikTok URLs or URLs without video ID
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900">
            <div className="text-center p-2">
              <Video className="h-6 w-6 mx-auto mb-1 text-pink-400/60" />
              <p className="text-[10px] text-muted-foreground truncate">
                {domainFromUrl(url)}
              </p>
            </div>
          </div>
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
