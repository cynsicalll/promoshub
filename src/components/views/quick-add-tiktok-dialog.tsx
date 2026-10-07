"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Link2, Check, Loader2, Plus, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePromos, useSounds } from "@/hooks/use-data";
import { useI18n } from "@/components/language-provider";
import { formatDate } from "@/lib/format";

export function QuickAddTiktokDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: promos = [] } = usePromos();
  const { data: sounds = [] } = useSounds();

  const [selectedPromoId, setSelectedPromoId] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [soundId, setSoundId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [justAdded, setJustAdded] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedPromoId("");
      setUrl("");
      setTitle("");
      setSoundId("");
      setJustAdded(false);
    }
  }, [open]);

  // Auto-select the promo with the most recent TikTok target activity
  // (or the first promo) if only one promo exists
  React.useEffect(() => {
    if (open && !selectedPromoId && promos.length === 1) {
      setSelectedPromoId(promos[0].id);
    }
  }, [open, promos, selectedPromoId]);

  const selectedPromo = promos.find((p) => p.id === selectedPromoId);

  async function handleSubmit(addAnother: boolean = false) {
    if (!selectedPromoId) {
      toast.error(t("quickAdd.promoRequired"));
      return;
    }
    if (!url.trim()) {
      toast.error(t("quickAdd.urlRequired"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/promos/${selectedPromoId}/tiktoks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || undefined,
          soundId: soundId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }

      qc.invalidateQueries({ queryKey: ["promos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["monthly"] });
      qc.invalidateQueries({ queryKey: ["channel-stats"] });
      qc.invalidateQueries({ queryKey: ["tiktok-stats"] });

      toast.success(
        t("quickAdd.success", { promo: selectedPromo?.name || "" })
      );

      if (addAnother) {
        // Keep the same promo selected, just clear the URL/title
        setUrl("");
        setTitle("");
        setSoundId("");
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      } else {
        onOpenChange(false);
      }
    } catch {
      toast.error(t("quickAdd.error"));
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
            {t("quickAdd.title")}
          </DialogTitle>
          <DialogDescription>{t("quickAdd.description")}</DialogDescription>
        </DialogHeader>

        {promos.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("quickAdd.noPromos")}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Promo selector */}
            <div className="space-y-1.5">
              <Label>{t("quickAdd.selectPromo")}</Label>
              <Select
                value={selectedPromoId}
                onValueChange={setSelectedPromoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("quickAdd.selectPromoPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {promos.map((p) => {
                    const done = p.tiktokTarget > 0 && (p.tiktoks?.length || 0) >= p.tiktokTarget;
                    const isActive = p.status === "AKTIV";
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-1.5 truncate">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : isActive ? (
                            <Circle className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                          ) : null}
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            · {p.tiktoks?.length || 0}/{p.tiktokTarget || 0}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedPromo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Video className="h-3 w-3" />
                    {t("quickAdd.tiktokCount", {
                      count: selectedPromo.tiktoks?.length || 0,
                    })}
                  </Badge>
                  {selectedPromo.tiktokTarget > 0 && (
                    <span>
                      / {selectedPromo.tiktokTarget} {t("form.tiktokTarget").toLowerCase().replace("target number of tiktoks for this promo", "target")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* TikTok URL */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-url" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                {t("quickAdd.url")}
              </Label>
              <Input
                id="quick-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("form.tiktokUrlPlaceholder")}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(false);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                vm.tiktok.com/… or www.tiktok.com/@user/video/…
              </p>
            </div>

            {/* Title (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-title">
                {t("quickAdd.titleField")}
              </Label>
              <Input
                id="quick-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("quickAdd.titlePlaceholder")}
              />
            </div>

            {/* Sound (optional) */}
            <div className="space-y-1.5">
              <Label>{t("quickAdd.sound")}</Label>
              <Select
                value={soundId}
                onValueChange={(v) => setSoundId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("quickAdd.noSound")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("quickAdd.noSound")}</SelectItem>
                  {sounds.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.artist ? ` · ${s.artist}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {justAdded && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                {t("quickAdd.success", { promo: selectedPromo?.name || "" })}
              </div>
            )}
          </div>
        )}

        {promos.length > 0 && (
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={saving || !url.trim() || !selectedPromoId}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("quickAdd.addAnother")}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={saving || !url.trim() || !selectedPromoId}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("action.saving")}
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  {t("quickAdd.submit")}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
