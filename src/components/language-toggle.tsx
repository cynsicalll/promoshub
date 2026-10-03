"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { LANGS, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const current = LANGS.find((l) => l.value === lang) || LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="gap-1.5">
          <Globe className="h-4 w-4" />
          {!compact && <span className="text-xs font-medium">{current.flag}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => setLang(l.value as Lang)}
            className={cn(
              "gap-2 cursor-pointer",
              lang === l.value && "bg-accent"
            )}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
            {lang === l.value && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
