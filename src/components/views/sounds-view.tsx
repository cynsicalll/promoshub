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
import { Music2, Plus, Pencil, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import type { Sound, SoundInput } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export function SoundsView() {
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
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (formOpen) {
      setName(editSound?.name || "");
      setArtist(editSound?.artist || "");
      setInternalRef(editSound?.internalRef || "");
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
      toast.error("Soundname ist erforderlich");
      return;
    }
    const payload: SoundInput = {
      name: name.trim(),
      artist: artist || null,
      internalRef: internalRef || null,
      notes: notes || null,
    };
    try {
      if (editSound) {
        await updateSound.mutateAsync({ id: editSound.id, data: payload });
        toast.success("Sound aktualisiert");
      } else {
        await createSound.mutateAsync(payload);
        toast.success("Sound angelegt");
      }
      setFormOpen(false);
      setEditSound(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSound.mutateAsync(deleteId);
      toast.success("Sound gelöscht");
    } catch {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeleteId(null);
    }
  }

  function handleExport() {
    window.open("/api/export?type=sounds&format=csv", "_blank");
    toast.success("Sounds werden exportiert");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sounds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deine Sound-Bibliothek – einmal anlegen, beliebig oft verwenden.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditSound(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Neuer Sound
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sound, Artist oder Bezeichnung suchen…"
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
                <TableHead className="min-w-[180px]">Sound</TableHead>
                <TableHead className="min-w-[140px]">Artist</TableHead>
                <TableHead className="w-[140px]">Interne Bez.</TableHead>
                <TableHead className="text-center w-[100px]">Verwendungen</TableHead>
                <TableHead className="text-center w-[110px]">Gebucht</TableHead>
                <TableHead className="text-center w-[100px]">Verwendet</TableHead>
                <TableHead className="w-[80px] text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Lade…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Music2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Keine Sounds gefunden.
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
              {editSound ? "Sound bearbeiten" : "Neuen Sound anlegen"}
            </DialogTitle>
            <DialogDescription>
              Einmal angelegt, kann der Sound in beliebig vielen Promos verwendet werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sound-name">Soundname *</Label>
              <Input
                id="sound-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Summer Vibes Beat"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sound-artist">Artist</Label>
                <Input
                  id="sound-artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="z. B. DJ Lumo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sound-ref">Interne Bezeichnung</Label>
                <Input
                  id="sound-ref"
                  value={internalRef}
                  onChange={(e) => setInternalRef(e.target.value)}
                  placeholder="z. B. SVB-01"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sound-notes">Notizen</Label>
              <Textarea
                id="sound-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="z. B. Upbeat, gut für Sommerkampagnen."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSound.isPending || updateSound.isPending}
            >
              {editSound ? "Speichern" : "Anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sound löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Sound wird aus allen Promos entfernt, in denen er verwendet wird.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
