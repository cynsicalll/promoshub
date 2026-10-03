"use client";

import * as React from "react";
import {
  useSounds,
  useCreateSound,
  useUpdateSound,
  useDeleteSound,
  usePromos,
} from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Music2, Plus, Pencil, Trash2, Download, Search, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Sound, SoundInput } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { normalizeUrl, domainFromUrl } from "@/lib/format";
import { useI18n } from "@/components/language-provider";

export function SoundsView() {
  const { t } = useI18n();
  const { data: sounds = [], isLoading } = useSounds();
  const { data: promos = [] } = usePromos();
  const createSound = useCreateSound();
  const updateSound = useUpdateSound();
  const deleteSound = useDeleteSound();
  const openPromo = useAppStore((s) => s.openPromo);

  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editSound, setEditSound] = React.useState<Sound | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [artist, setArtist] = React.useState("");
  const [internalRef, setInternalRef] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (formOpen) {
      setName(editSound?.name || "");
      setArtist(editSound?.artist || "");
      setInternalRef(editSound?.internalRef || "");
      setUrl(editSound?.url || "");
      setNotes(editSound?.notes || "");
    }
  }, [formOpen, editSound]);

  // usage map: soundId -> { total, used, promos }
  const usage = React.useMemo(() => {
    const map: Record<
      string,
      { total: number; used: number; promoIds: Set<string> }
    > = {};
    for (const p of promos) {
      for (const ps of p.sounds) {
        if (!map[ps.soundId])
          map[ps.soundId] = { total: 0, used: 0, promoIds: new Set() };
        map[ps.soundId].total += ps.quantityTotal;
        map[ps.soundId].used += ps.quantityUsed;
        map[ps.soundId].promoIds.add(p.id);
      }
    }
    return map;
  }, [promos]);

  const filtered = sounds.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.artist || "").toLowerCase().includes(q) ||
      (s.internalRef || "").toLowerCase().includes(q)
    );
  });

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error(t("sounds.error.nameRequired"));
      return;
    }
    const payload: SoundInput = {
      name: name.trim(),
      artist: artist || null,
      internalRef: internalRef || null,
      url: url || null,
      notes: notes || null,
    };
    try {
      if (editSound) {
        await updateSound.mutateAsync({ id: editSound.id, data: payload });
        toast.success(t("sounds.toast.updated"));
      } else {
        await createSound.mutateAsync(payload);
        toast.success(t("sounds.toast.created"));
      }
      setFormOpen(false);
      setEditSound(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSound.mutateAsync(deleteId);
      toast.success(t("sounds.toast.deleted"));
    } catch {
      toast.error(t("common.deleteFailed"));
    } finally {
      setDeleteId(null);
    }
  }

  function handleExport() {
    window.open("/api/export?type=sounds&format=csv", "_blank");
    toast.success(t("settings.exportStarted"));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("sounds.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("sounds.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> {t("action.export")}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditSound(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> {t("form.newSound")}
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("sounds.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[180px]">{t("sounds.col.sound")}</TableHead>
                <TableHead className="min-w-[140px]">{t("sounds.col.artist")}</TableHead>
                <TableHead className="w-[140px]">{t("sounds.col.internalRef")}</TableHead>
                <TableHead className="min-w-[140px]">{t("sounds.col.link")}</TableHead>
                <TableHead className="text-center w-[100px]">{t("sounds.col.uses")}</TableHead>
                <TableHead className="text-center w-[110px]">{t("sounds.col.booked")}</TableHead>
                <TableHead className="text-center w-[100px]">{t("sounds.col.used")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("sounds.col.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {t("action.loading")}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Music2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {t("sounds.noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const u = usage[s.id] || {
                    total: 0,
                    used: 0,
                    promoIds: new Set<string>(),
                  };
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        {s.name}
                        {s.notes && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {s.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.artist || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.internalRef || "—"}
                      </TableCell>
                      <TableCell>
                        {s.url ? (
                          <a
                            href={normalizeUrl(s.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400 text-sm"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {domainFromUrl(s.url)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="tabular-nums">{u.promoIds.size}</span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {u.total}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {u.used}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditSound(s);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editSound ? t("sounds.editTitle") : t("sounds.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("sounds.formDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sound-name">{t("form.soundName")}</Label>
              <Input
                id="sound-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("form.soundNamePlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sound-artist">{t("form.artist")}</Label>
                <Input
                  id="sound-artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder={t("form.artistPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sound-ref">{t("form.internalRef")}</Label>
                <Input
                  id="sound-ref"
                  value={internalRef}
                  onChange={(e) => setInternalRef(e.target.value)}
                  placeholder={t("form.internalRefPlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sound-url" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> {t("form.soundUrl")}
              </Label>
              <Input
                id="sound-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("form.soundUrlPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("form.soundUrlHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sound-notes">{t("form.soundNotes")}</Label>
              <Textarea
                id="sound-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t("form.soundNotesPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSound.isPending || updateSound.isPending}
            >
              {editSound ? t("action.save") : t("action.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.soundTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.soundDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
