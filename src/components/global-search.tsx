"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { Promo, Customer, Sound } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Megaphone,
  Users,
  Music2,
  Search as SearchIcon,
} from "lucide-react";

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<{
    promos: Promo[];
    customers: Customer[];
    sounds: Sound[];
  }>({ promos: [], customers: [], sounds: [] });
  const openPromo = useAppStore((s) => s.openPromo);
  const setView = useAppStore((s) => s.setView);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setResults({ promos: [], customers: [], sounds: [] });
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!q.trim()) {
      setResults({ promos: [], customers: [], sounds: [] });
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await api.search(q);
        setResults(r);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function handlePromo(id: string) {
    onOpenChange(false);
    openPromo(id);
  }
  function handleView(view: "customers" | "sounds") {
    onOpenChange(false);
    setView(view);
  }

  const total =
    results.promos.length + results.customers.length + results.sounds.length;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Promos, Kunden, Sounds, Beträge durchsuchen…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>
          {q ? "Keine Treffer." : "Tippe um zu suchen."}
        </CommandEmpty>

        {results.promos.length > 0 && (
          <CommandGroup heading="Promos">
            {results.promos.map((p) => (
              <CommandItem
                key={p.id}
                value={`promo-${p.id}-${p.name}`}
                onSelect={() => handlePromo(p.id)}
                className="gap-3"
              >
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {p.customer?.name || "—"}
                    {p.payments?.length
                      ? ` · ${formatCurrency(
                          p.payments.reduce((s, x) => s + x.amount, 0)
                        )}`
                      : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.customers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Kunden">
              {results.customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`customer-${c.id}-${c.name}`}
                  onSelect={() => handleView("customers")}
                  className="gap-3"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                    <span className="truncate">{c.name}</span>
                    {c.company && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {c.company}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.sounds.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Sounds">
              {results.sounds.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`sound-${s.id}-${s.name}`}
                  onSelect={() => handleView("sounds")}
                  className="gap-3"
                >
                  <Music2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                    <span className="truncate">{s.name}</span>
                    {s.artist && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {s.artist}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {q && total === 0 && (
          <CommandEmpty>Keine Treffer für „{q}".</CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-2.5 rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-64"
    >
      <SearchIcon className="h-4 w-4" />
      <span className="flex-1 text-left">Suchen…</span>
      <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  );
}
