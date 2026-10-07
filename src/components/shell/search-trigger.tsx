"use client";

import { Search } from "lucide-react";

/** Auslöser in der Kopfzeile, sieht aus wie ein Suchfeld */
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      aria-label="Schnellsuche öffnen"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">
        Suchen und springen
      </span>
      <kbd className="hidden rounded font-sans border border-border bg-muted px-1.5 text-[11px] font-medium sm:inline">
        Strg K
      </kbd>
    </button>
  );
}
