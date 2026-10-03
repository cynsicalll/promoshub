"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  Trash2,
  Pencil,
  KeyRound,
  Users,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface CustomerUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  promoAccess: {
    promo: {
      id: string;
      name: string;
      date: string;
      status: string;
    };
  }[];
}

interface Promo {
  id: string;
  name: string;
  date: string;
  status: string;
}

export function CustomerAccessSection() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<CustomerUser | null>(null);

  const { data: users = [], isLoading } = useQuery<CustomerUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Fehler beim Laden");
      return res.json();
    },
  });

  const { data: promos = [] } = useQuery<Promo[]>({
    queryKey: ["promos-for-access"],
    queryFn: async () => {
      const res = await fetch("/api/promos");
      if (!res.ok) throw new Error("Fehler");
      return res.json();
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Kundenzugang gelöscht");
    },
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Kundenzugänge verwalten</h2>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditUser(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" /> Neuer Kundenzugang
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Erstellen Sie Kunden-Logins mit beliebigem Namen und Passwort und
        weisen Sie ihnen Promos zu. Kunden sehen nach dem Login nur ihre
        zugewiesenen Promos mit Status, Sounds und TikTok-Links.
      </p>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Noch keine Kundenzugänge angelegt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{u.username}</span>
                    {u.displayName && (
                      <Badge variant="secondary" className="text-xs">
                        {u.displayName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Angelegt am {formatDate(u.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditUser(u);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Kundenzugang „{u.username}" löschen?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Der Zugang wird unwiderruflich entfernt. Der Kunde
                          kann sich danach nicht mehr anmelden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUser.mutate(u.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {u.promoAccess.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {u.promoAccess.map((pa) => (
                    <Badge
                      key={pa.promo.id}
                      variant="outline"
                      className="text-xs gap-1"
                    >
                      {pa.promo.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editUser}
        promos={promos}
      />
    </Card>
  );
}

function UserFormDialog({
  open,
  onOpenChange,
  user,
  promos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: CustomerUser | null;
  promos: Promo[];
}) {
  const qc = useQueryClient();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [selectedPromos, setSelectedPromos] = React.useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUsername(user?.username || "");
      setPassword("");
      setDisplayName(user?.displayName || "");
      setSelectedPromos(
        new Set(user?.promoAccess.map((pa) => pa.promo.id) || [])
      );
    }
  }, [open, user]);

  function togglePromo(id: string) {
    setSelectedPromos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!username.trim()) {
      toast.error("Benutzername erforderlich");
      return;
    }
    if (!user && (!password || password.length < 4)) {
      toast.error("Passwort muss mindestens 4 Zeichen lang sein");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: displayName || undefined,
        promoIds: Array.from(selectedPromos),
      };
      if (password) payload.password = password;
      if (!user) payload.username = username.trim();

      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Speichern");
      }
      toast.success(user ? "Zugang aktualisiert" : "Zugang erstellt");
      qc.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? "Kundenzugang bearbeiten" : "Neuen Kundenzugang erstellen"}
          </DialogTitle>
          <DialogDescription>
            Der Kunde meldet sich mit diesen Daten an und sieht nur die
            zugewiesenen Promos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cu-username">Benutzername *</Label>
            <Input
              id="cu-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="z. B. nike_lisa"
              disabled={!!user}
            />
            {user && (
              <p className="text-xs text-muted-foreground">
                Der Benutzername kann nicht geändert werden.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-displayname">
              Anzeigename (optional)
            </Label>
            <Input
              id="cu-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="z. B. Lisa Müller (Nike)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-password">
              Passwort {user ? "(leer = nicht ändern)" : "*"}
            </Label>
            <Input
              id="cu-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? "Neues Passwort (optional)" : "Mind. 4 Zeichen"}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Zugewiesene Promos</Label>
            <p className="text-xs text-muted-foreground">
              Wählen Sie die Promos, die dieser Kunde sehen darf.
            </p>
            {promos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Keine Promos vorhanden.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border p-2">
                {promos.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 rounded p-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPromos.has(p.id)}
                      onCheckedChange={() => togglePromo(p.id)}
                    />
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(p.date)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedPromos.size} Promo(s) ausgewählt
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Speichern…" : user ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
