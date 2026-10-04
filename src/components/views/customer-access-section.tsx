"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
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
  Link2,
  Link2Off,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/components/language-provider";

interface CustomerUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  shareToken: string | null;
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
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user: authUser } = useAuth();
  const isDemo = authUser?.role === "DEMO";
  const [formOpen, setFormOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<CustomerUser | null>(null);

  const { data: users = [], isLoading } = useQuery<CustomerUser[]>({
    queryKey: isDemo ? ["demo", "users"] : ["users"],
    queryFn: async () => {
      if (isDemo) {
        const res = await fetch("/api/demo-data");
        if (!res.ok) throw new Error("Failed");
        const d = await res.json();
        return d.demoUsers || [];
      }
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error(t("customerAccess.toast.loadFailed"));
      return res.json();
    },
  });

  const { data: promos = [] } = useQuery<Promo[]>({
    queryKey: isDemo ? ["demo", "promos-for-access"] : ["promos-for-access"],
    queryFn: async () => {
      if (isDemo) {
        const res = await fetch("/api/demo-data");
        if (!res.ok) throw new Error("Failed");
        const d = await res.json();
        return d.promos || [];
      }
      const res = await fetch("/api/promos");
      if (!res.ok) throw new Error(t("common.error"));
      return res.json();
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("customerAccess.toast.deleteFailed"));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("settings.customerAccessDeleted"));
    },
    onError: () => toast.error(t("customerAccess.toast.deleteFailed")),
  });

  const generateLink = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}/link`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("settings.linkGenerated"));
    },
    onError: () => toast.error(t("settings.linkGenerateFailed")),
  });

  const revokeLink = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}/link`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("settings.linkRevoked"));
    },
    onError: () => toast.error(t("settings.linkRevokeFailed")),
  });

  async function copyCustomerLink(token: string) {
    const url = `${window.location.origin}/c/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("settings.linkCopied"), { description: url });
    } catch {
      toast.error(t("settings.linkCopyFailed"));
    }
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("settings.customerAccess")}</h2>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditUser(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" /> {t("settings.newCustomerAccess")}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("settings.customerAccessDesc")}
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
            {t("settings.noCustomerAccess")}
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
                    {t("settings.createdAt")} {formatDate(u.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {u.shareToken ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                        onClick={() => copyCustomerLink(u.shareToken!)}
                        title={t("settings.copyLink")}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            title={t("settings.revokeLink")}
                          >
                            <Link2Off className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("settings.revokeLinkTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("settings.revokeLinkDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeLink.mutate(u.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              {t("settings.revokeLink")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => generateLink.mutate(u.id)}
                      disabled={generateLink.isPending}
                      title={t("settings.createLink")}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  )}
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
                          {t("settings.customerAccessDeleteTitle", { username: u.username })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("settings.customerAccessDeleteDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUser.mutate(u.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          {t("action.delete")}
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
              {u.shareToken && (
                <div className="rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {typeof window !== "undefined" ? window.location.origin : ""}/c/{u.shareToken}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 shrink-0"
                    onClick={() => copyCustomerLink(u.shareToken!)}
                  >
                    {t("action.copy")}
                  </Button>
                  <a
                    href={`/c/${u.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 shrink-0">
                      {t("action.open")}
                    </Button>
                  </a>
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
  const { t } = useI18n();
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
      toast.error(t("customerAccess.error.usernameRequired"));
      return;
    }
    if (!user && (!password || password.length < 4)) {
      toast.error(t("customerAccess.error.passwordMin"));
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
        const fallback = user
          ? t("customerAccess.toast.saveFailed")
          : t("customerAccess.error.usernameTaken");
        throw new Error(data.error || fallback);
      }
      toast.success(
        user ? t("settings.customerAccessUpdated") : t("settings.customerAccessCreated")
      );
      qc.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? t("settings.form.editAccess") : t("settings.form.createAccess")}
          </DialogTitle>
          <DialogDescription>
            {t("settings.form.accessDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cu-username">{t("settings.form.username")}</Label>
            <Input
              id="cu-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("settings.form.usernamePlaceholder")}
              disabled={!!user}
            />
            {user && (
              <p className="text-xs text-muted-foreground">
                {t("settings.form.usernameLocked")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-displayname">
              {t("settings.form.displayName")}
            </Label>
            <Input
              id="cu-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("settings.form.displayNamePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-password">
              {user
                ? `${t("settings.form.password")} ${t("settings.form.passwordEdit")}`
                : t("settings.form.passwordCreate")}
            </Label>
            <Input
              id="cu-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? t("settings.form.passwordEditPlaceholder") : t("settings.form.passwordPlaceholder")}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("settings.form.assignedPromos")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("settings.form.assignedPromosDesc")}
            </p>
            {promos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("settings.form.noPromos")}
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
              {t("settings.selectedPromos", { count: selectedPromos.size })}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("action.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t("action.saving") : user ? t("action.save") : t("action.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
