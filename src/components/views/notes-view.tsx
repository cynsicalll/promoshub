"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/language-provider";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const COLORS: Record<string, { card: string; border: string; label: string }> = {
  default: { card: "", border: "", label: "Default" },
  yellow: { card: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200 dark:border-yellow-900/50", label: "Yellow" },
  green: { card: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/50", label: "Green" },
  blue: { card: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-900/50", label: "Blue" },
  pink: { card: "bg-pink-50 dark:bg-pink-950/20", border: "border-pink-200 dark:border-pink-900/50", label: "Pink" },
  orange: { card: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-900/50", label: "Orange" },
};

const COLOR_KEYS = Object.keys(COLORS);

export function NotesView() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editColor, setEditColor] = React.useState("default");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Note", content: "" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title?: string; content?: string; color?: string; pinned?: boolean }) => {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
      setDeleteId(null);
    },
  });

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
  }

  function saveEdit() {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      title: editTitle,
      content: editContent,
      color: editColor,
    });
    setEditingId(null);
    toast.success("Note saved");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-muted-foreground" />
            Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal notes — daily thoughts, reminders, ideas.
          </p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="gap-2"
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New Note
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <Card className="p-10 text-center">
          <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No notes yet. Click "New Note" to create one.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedNotes.map((note) => {
            const isEditing = editingId === note.id;
            const color = COLORS[note.color] || COLORS.default;
            return (
              <Card
                key={note.id}
                className={`p-4 space-y-3 ${color.card} ${color.border} ${isEditing ? "ring-2 ring-indigo-400" : ""}`}
              >
                {isEditing ? (
                  <>
                    {/* Edit mode */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-sm font-semibold"
                        placeholder="Title"
                        autoFocus
                      />
                    </div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[120px] text-sm resize-none"
                      placeholder="Write your note..."
                    />
                    {/* Color picker */}
                    <div className="flex items-center gap-1.5">
                      {COLOR_KEYS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`h-5 w-5 rounded-full border-2 transition-all ${editColor === c ? "border-indigo-500 scale-110" : "border-transparent"} ${COLORS[c].card || "bg-muted"}`}
                          title={COLORS[c].label}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={saveEdit} className="gap-1.5">
                        <Check className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5">
                        <X className="h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Display mode */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0 fill-amber-500" />}
                        <h3
                          className="text-sm font-semibold truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => startEdit(note)}
                        >
                          {note.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateMutation.mutate({ id: note.id, pinned: !note.pinned })}
                          title={note.pinned ? "Unpin" : "Pin"}
                        >
                          {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600"
                          onClick={() => setDeleteId(note.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p
                      className="text-sm text-muted-foreground whitespace-pre-wrap cursor-pointer min-h-[60px]"
                      onClick={() => startEdit(note)}
                    >
                      {note.content || <span className="italic opacity-50">Click to write...</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(note.updatedAt).toLocaleString("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
