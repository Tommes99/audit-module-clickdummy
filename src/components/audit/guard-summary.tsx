"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, OctagonX } from "lucide-react";
import { HelpHint } from "@/components/shared/help-hint";
import { cn } from "@/lib/utils";

/**
 * Kompakte Zusammenfassung der Guards direkt unter den Statusbuttons (CLAUDE.md Abschnitt 6).
 * Eine einzige Box mit Zähler in der Kopfzeile, Details lassen sich einklappen.
 */
export function GuardSummary({ blockers, warnings }: { blockers: string[]; warnings: string[] }) {
  const [open, setOpen] = useState(true);
  if (blockers.length === 0 && warnings.length === 0) return null;
  const danger = blockers.length > 0;
  const Icon = danger ? OctagonX : AlertTriangle;
  const parts = [
    blockers.length > 0 ? `${blockers.length} Blocker` : null,
    warnings.length > 0 ? `${warnings.length} ${warnings.length === 1 ? "Warnung" : "Warnungen"}` : null,
  ].filter(Boolean);

  return (
    <div
      role={danger ? "alert" : "status"}
      className={cn(
        "mb-6 rounded-lg border text-sm",
        danger ? "border-danger/25 bg-danger-soft text-danger-ink" : "border-warning/30 bg-warning-soft text-warning-ink",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Icon className="size-4 shrink-0" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-7 flex-1 items-center gap-2 rounded text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="tnum">{parts.join(", ")}</span>
          <ChevronDown className={cn("size-4 opacity-70 transition-transform", open && "rotate-180")} aria-hidden />
          <span className="sr-only">{open ? "Details ausblenden" : "Details anzeigen"}</span>
        </button>
        <HelpHint topic="audit.guards" side="left" />
      </div>
      {open && (
        <ul className="space-y-1 border-t border-current/10 px-3 py-2">
          {blockers.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold leading-5">Blocker</span>
              <span>{b}</span>
            </li>
          ))}
          {warnings.map((w) => (
            <li key={w} className={cn("flex gap-2", danger && "text-warning-ink")}>
              <span className="w-16 shrink-0 text-xs font-semibold leading-5">Warnung</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
