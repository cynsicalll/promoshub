"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Image as ImageIcon,
  Link2,
  Video,
  Trophy,
  Music2,
  User,
  Sparkles,
  Wand2,
  ExternalLink,
  GripVertical,
  Upload,
  Eye,
  Flag,
} from "lucide-react";
import type { BioProfile, BioVideo, BioSocial, BioProject, BioMilestone } from "@/app/api/bio/route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Resize an image file to a square data URI using canvas.
// Works entirely client-side — no server upload needed (Vercel-safe).
function resizeImage(file: File, w: number, h: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        // Cover-fit (crop to center)
        const scale = Math.max(w / img.width, h / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Section shell ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string;
  icon: React.ElementType;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <Separator />
      {children}
    </Card>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

export function BioEditorView() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<BioProfile>({
    queryKey: ["bio-profile"],
    queryFn: async () => {
      const res = await fetch("/api/bio");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  // Local working copy
  const [draft, setDraft] = React.useState<BioProfile | null>(null);

  React.useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  const saveMutation = useMutation({
    mutationFn: async (payload: BioProfile) => {
      const res = await fetch("/api/bio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Save failed (HTTP ${res.status})`;
        try {
          const err = await res.json();
          if (err.error) msg = err.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: (saved) => {
      setDraft(saved);
      qc.setQueryData(["bio-profile"], saved);
      toast.success("Bio page saved");
    },
    onError: (err: Error) => toast.error(`Failed to save: ${err.message}`),
  });

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const update = (patch: Partial<BioProfile>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-fuchsia-500" />
            Bio Page
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit your public landing page. Changes go live instantly on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open("/", "_blank");
            }}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View page
          </Button>
          <Button
            size="sm"
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(draft)}
            className="gap-1.5"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {dirty && (
        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Unsaved changes — remember to hit Save.
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-1.5 text-xs sm:text-sm">
            <Music2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-1.5 text-xs sm:text-sm">
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5 text-xs sm:text-sm">
            <Video className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5 text-xs sm:text-sm">
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Wins</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Profile tab ─── */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <SectionCard
            title="Profile"
            icon={User}
            description="Your avatar, display name and bio shown at the top of the page."
          >
            <div className="space-y-4">
              {/* Avatar with upload + URL */}
              <ProfileImageEditor
                currentImage={draft.profileImage ?? ""}
                displayName={draft.displayName}
                onChange={(url) => update({ profileImage: url })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs">
                    Display name
                  </Label>
                  <Input
                    id="displayName"
                    value={draft.displayName}
                    onChange={(e) => update({ displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline" className="text-xs">
                    Tagline
                  </Label>
                  <Input
                    id="tagline"
                    placeholder="Sound producer · TikTok creator"
                    value={draft.tagline ?? ""}
                    onChange={(e) => update({ tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs">
                  Bio / description
                </Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={draft.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Projects"
            icon={Link2}
            description="Showcase the websites and projects you've built."
          >
            <ProjectEditor
              projects={draft.projects}
              onChange={(projects) => update({ projects })}
            />
          </SectionCard>
        </TabsContent>

        {/* ─── TikTok tab ─── */}
        <TabsContent value="tiktok" className="space-y-4 mt-4">
          <SectionCard
            title="TikTok account"
            icon={Music2}
            description="Your handle and the public link to your profile."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Handle (without @)</Label>
                <Input
                  value={draft.tiktokHandle.replace(/^@/, "")}
                  onChange={(e) => {
                    const handle = e.target.value.replace(/^@/, "");
                    update({
                      tiktokHandle: handle,
                      tiktokUrl: `https://www.tiktok.com/@${handle}`,
                    });
                  }}
                  placeholder="sigmadudereal"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Profile URL</Label>
                <Input
                  value={draft.tiktokUrl}
                  onChange={(e) => update({ tiktokUrl: e.target.value })}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Stats"
            icon={Sparkles}
            description="The numbers shown in the TikTok Stats section. Toggle a stat off to hide its tile."
          >
            <div className="space-y-3">
              <StatRow
                label="Followers"
                show={draft.showFollowers}
                onToggle={(v) => update({ showFollowers: v })}
                value={draft.followers}
                onChange={(n) => update({ followers: n })}
                placeholder="100000"
              />
              <StatRow
                label="Total Views"
                show={draft.showTotalViews ?? false}
                onToggle={(v) => update({ showTotalViews: v })}
                value={draft.totalViews ?? 0}
                onChange={(n) => update({ totalViews: n })}
                placeholder="100000000"
              />
              <StatRow
                label="Total Likes"
                show={draft.showTotalLikes}
                onToggle={(v) => update({ showTotalLikes: v })}
                value={draft.totalLikes}
                onChange={(n) => update({ totalLikes: n })}
                placeholder="10000000"
              />
              <StatRow
                label="Videos"
                show={draft.showVideoCount}
                onToggle={(v) => update({ showVideoCount: v })}
                value={draft.videoCount}
                onChange={(n) => update({ videoCount: n })}
                placeholder="50"
              />
              <StatRow
                label="Following"
                show={draft.showFollowing}
                onToggle={(v) => update({ showFollowing: v })}
                value={draft.following}
                onChange={(n) => update({ following: n })}
                placeholder="0"
              />
              <p className="text-[11px] text-muted-foreground pt-1">
                Tip: enter raw numbers (e.g. <code>100000</code>) — they'll be
                displayed as <code>100K</code> automatically.
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ─── Milestones tab ─── */}
        <TabsContent value="milestones" className="space-y-4 mt-4">
          <SectionCard
            title="Milestones"
            icon={Flag}
            description="A timeline of your achievements with dates. Shown on the bio page, sorted by date (most recent first)."
          >
            <MilestoneEditor
              milestones={draft.milestones ?? []}
              onChange={(milestones) => update({ milestones })}
            />
          </SectionCard>
        </TabsContent>

        {/* ─── Videos tab ─── */}
        <TabsContent value="videos" className="space-y-4 mt-4">
          <SectionCard
            title="Popular Videos"
            icon={Video}
            description="Add your 1M+ view TikTok videos. Paste a URL and hit the wand to auto-fetch the thumbnail, title and view count."
          >
            <VideoEditor
              videos={draft.videos}
              onChange={(videos) => update({ videos })}
            />
          </SectionCard>
        </TabsContent>

        {/* ─── Links tab ─── */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <SectionCard
            title="Social Links"
            icon={Link2}
            description="The pill-shaped buttons under your name (TikTok, Instagram, etc.)."
          >
            <SocialEditor
              socials={draft.socials}
              onChange={(socials) => update({ socials })}
            />
          </SectionCard>
        </TabsContent>

        {/* ─── Achievements tab ─── */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          <SectionCard
            title="Achievements"
            icon={Trophy}
            description="A list of wins shown with a trophy icon. Add anything you're proud of."
          >
            <AchievementEditor
              achievements={draft.achievements}
              onChange={(achievements) => update({ achievements })}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Profile image editor (upload + URL) ─────────────────────────────────────

function ProfileImageEditor({
  currentImage,
  displayName,
  onChange,
}: {
  currentImage: string;
  displayName: string;
  onChange: (url: string) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    setUploading(true);
    try {
      // Resize + compress client-side (works on Vercel — no filesystem needed)
      const dataUri = await resizeImage(file, 256, 256, 0.85);
      onChange(dataUri);
      toast.success("Profile picture set — click Save to apply");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-emerald-500 p-0.5 shrink-0">
        <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center relative">
          {currentImage ? (
             
            <img
              src={currentImage}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-zinc-500" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="gap-1.5"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload
          </Button>
          {currentImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
        <Input
          placeholder="…or paste an image URL"
          value={currentImage.startsWith("/avatars/") ? "" : currentImage}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          Upload an image from your device, or paste a URL. Max 2MB.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ─── Stat row ────────────────────────────────────────────────────────────────

function StatRow({
  label,
  show,
  onToggle,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  show: boolean;
  onToggle: (v: boolean) => void;
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex-1">
        <Label className="text-xs">{label}</Label>
        <Input
          type="number"
          min={0}
          className="mt-1"
          placeholder={placeholder}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
          disabled={!show}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <Switch checked={show} onCheckedChange={onToggle} />
        <span className="text-[10px] text-muted-foreground">{show ? "Visible" : "Hidden"}</span>
      </div>
    </div>
  );
}

// ─── Social editor ───────────────────────────────────────────────────────────

function SocialEditor({
  socials,
  onChange,
}: {
  socials: BioSocial[];
  onChange: (s: BioSocial[]) => void;
}) {
  const add = () =>
    onChange([...socials, { id: uid("social"), title: "", url: "", handle: "" }]);

  return (
    <div className="space-y-3">
      {socials.length === 0 && (
        <p className="text-xs text-muted-foreground">No social links yet.</p>
      )}
      {socials.map((s, i) => (
        <div key={s.id} className="flex items-start gap-2 rounded-lg border p-3">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
          <div className="flex-1 grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="TikTok"
              value={s.title}
              onChange={(e) => {
                const next = [...socials];
                next[i] = { ...s, title: e.target.value };
                onChange(next);
              }}
            />
            <Input
              placeholder="@handle"
              value={s.handle ?? ""}
              onChange={(e) => {
                const next = [...socials];
                next[i] = { ...s, handle: e.target.value };
                onChange(next);
              }}
            />
            <Input
              placeholder="https://…"
              value={s.url}
              onChange={(e) => {
                const next = [...socials];
                next[i] = { ...s, url: e.target.value };
                onChange(next);
              }}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(socials.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add link
      </Button>
    </div>
  );
}

// ─── Project editor ──────────────────────────────────────────────────────────

function ProjectEditor({
  projects,
  onChange,
}: {
  projects: BioProject[];
  onChange: (p: BioProject[]) => void;
}) {
  const add = () =>
    onChange([
      ...projects,
      { id: uid("project"), title: "", description: "", url: "", tags: [] },
    ]);

  return (
    <div className="space-y-3">
      {projects.length === 0 && (
        <p className="text-xs text-muted-foreground">No projects yet.</p>
      )}
      {projects.map((p, i) => (
        <div key={p.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Project title"
                value={p.title}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...p, title: e.target.value };
                  onChange(next);
                }}
              />
              <Textarea
                rows={2}
                placeholder="Short description"
                value={p.description}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...p, description: e.target.value };
                  onChange(next);
                }}
              />
              <Input
                placeholder="https://project-url.com"
                value={p.url ?? ""}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...p, url: e.target.value };
                  onChange(next);
                }}
              />
              <Input
                placeholder="Tags, comma separated"
                value={(p.tags ?? []).join(", ")}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...p, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) };
                  onChange(next);
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(projects.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add project
      </Button>
    </div>
  );
}

// ─── Achievement editor ──────────────────────────────────────────────────────

function AchievementEditor({
  achievements,
  onChange,
}: {
  achievements: string[];
  onChange: (a: string[]) => void;
}) {
  const add = () => onChange([...achievements, ""]);

  return (
    <div className="space-y-2">
      {achievements.length === 0 && (
        <p className="text-xs text-muted-foreground">No achievements yet.</p>
      )}
      {achievements.map((a, i) => (
        <div key={i} className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
          <Input
            value={a}
            placeholder="e.g. 100K+ TikTok followers"
            onChange={(e) => {
              const next = [...achievements];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(achievements.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add achievement
      </Button>
    </div>
  );
}

// ─── Video editor ────────────────────────────────────────────────────────────

function VideoEditor({
  videos,
  onChange,
}: {
  videos: BioVideo[];
  onChange: (v: BioVideo[]) => void;
}) {
  const [resolving, setResolving] = React.useState<string | null>(null);

  const add = () =>
    onChange([
      ...videos,
      { id: uid("video"), title: "", url: "", thumbnail: "", views: 0, likes: 0 },
    ]);

  const resolve = async (index: number) => {
    const v = videos[index];
    if (!v.url) {
      toast.error("Enter a TikTok URL first");
      return;
    }
    setResolving(v.id);
    try {
      const res = await fetch(`/api/tiktok-resolve?url=${encodeURIComponent(v.url)}`);
      if (!res.ok) throw new Error("resolve failed");
      const data = await res.json();
      const next = [...videos];
      next[index] = {
        ...v,
        title: data.title || v.title || "",
        thumbnail: data.cover || v.thumbnail || "",
        views: typeof data.playCount === "number" ? data.playCount : v.views ?? 0,
        likes: typeof data.likeCount === "number" ? data.likeCount : v.likes ?? 0,
      };
      onChange(next);
      toast.success(
        typeof data.playCount === "number"
          ? `Fetched — ${data.playCount.toLocaleString()} views`
          : "Fetched metadata (stats unavailable)"
      );
    } catch {
      toast.error("Couldn't fetch — enter the details manually");
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-3">
      {videos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No videos yet. Add your 1M+ view TikToks from the playlist.
        </p>
      )}
      {videos.map((v, i) => (
        <div key={v.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://www.tiktok.com/@sigmadudereal/video/…"
              value={v.url}
              onChange={(e) => {
                const next = [...videos];
                next[i] = { ...v, url: e.target.value };
                onChange(next);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => resolve(i)}
              disabled={resolving === v.id}
              className="gap-1.5 shrink-0"
            >
              {resolving === v.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5" />
              )}
              Auto
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(videos.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnail preview */}
          {(v.thumbnail || v.url) && (
            <div className="flex gap-3 items-start">
              <div className="w-16 h-24 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                {v.thumbnail ? (
                   
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Title (optional)"
                  value={v.title}
                  onChange={(e) => {
                    const next = [...videos];
                    next[i] = { ...v, title: e.target.value };
                    onChange(next);
                  }}
                />
                <Input
                  placeholder="Thumbnail URL"
                  value={v.thumbnail ?? ""}
                  onChange={(e) => {
                    const next = [...videos];
                    next[i] = { ...v, thumbnail: e.target.value };
                    onChange(next);
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Views (e.g. 1500000)"
                  value={v.views === 0 ? "" : v.views}
                  onChange={(e) => {
                    const next = [...videos];
                    next[i] = { ...v, views: Math.max(0, parseInt(e.target.value || "0", 10)) };
                    onChange(next);
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Likes (optional)"
                  value={v.likes === 0 ? "" : v.likes}
                  onChange={(e) => {
                    const next = [...videos];
                    next[i] = { ...v, likes: Math.max(0, parseInt(e.target.value || "0", 10)) };
                    onChange(next);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add video
      </Button>
    </div>
  );
}

// ─── Milestone editor ────────────────────────────────────────────────────────

const MILESTONE_ICONS = [
  { value: "trophy", label: "Trophy" },
  { value: "users", label: "Followers" },
  { value: "eye", label: "Views" },
  { value: "bike", label: "Bike" },
  { value: "ski", label: "Ski" },
  { value: "money", label: "Money" },
];

function MilestoneEditor({
  milestones,
  onChange,
}: {
  milestones: BioMilestone[];
  onChange: (m: BioMilestone[]) => void;
}) {
  const add = () =>
    onChange([
      ...milestones,
      { id: uid("milestone"), title: "", date: new Date().toISOString().slice(0, 10), icon: "trophy" },
    ]);

  return (
    <div className="space-y-3">
      {milestones.length === 0 && (
        <p className="text-xs text-muted-foreground">No milestones yet. Add your first achievement with a date.</p>
      )}
      {milestones.map((m, i) => (
        <div key={m.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Flag className="h-4 w-4 text-primary mt-2.5 shrink-0" />
            <div className="flex-1 grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Title (e.g. 100K followers)"
                value={m.title}
                onChange={(e) => {
                  const next = [...milestones];
                  next[i] = { ...m, title: e.target.value };
                  onChange(next);
                }}
              />
              <Input
                type="date"
                value={m.date}
                onChange={(e) => {
                  const next = [...milestones];
                  next[i] = { ...m, date: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(milestones.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={m.icon ?? "trophy"}
              onChange={(e) => {
                const next = [...milestones];
                next[i] = { ...m, icon: e.target.value };
                onChange(next);
              }}
            >
              {MILESTONE_ICONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="Description (optional)"
              value={m.description ?? ""}
              onChange={(e) => {
                const next = [...milestones];
                next[i] = { ...m, description: e.target.value };
                onChange(next);
              }}
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add milestone
      </Button>
    </div>
  );
}
