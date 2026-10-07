"use client";

import { AlertTriangle, CalendarClock, Check } from "lucide-react";
import { RiskBadge } from "@/components/shared/status-badge";
import { useAppStore } from "@/store/app-store";
import { formatDate } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { CoverageRow } from "@/store/selectors";

export type RowCell = CoverageRow["cells"][number];

/** Eine Lücke: zertifizierter Standort, Kapitel noch nie auditiert */
export const isGap = (c: RowCell) => c.certified && !c.cell.lastAuditedOn;

/**
 * Eine Zelle der Abdeckungsmatrix als Schaltfläche. Zustand immer als Symbol und Text:
 * "Nie auditiert" (Warnung), "Auditiert" (Haken), "Geplant" (Kalender). Ein Klick öffnet die Details.
 */
export function CoverageCellView({ cell: c, label, onOpen }: { cell: RowCell; label: string; onOpen: () => void }) {
  const { cell } = c;
  const nextAudit = useAppStore((s) => s.data.audits.find((a) => a.id === cell.nextPlannedAuditId));
  if (!c.certified && !cell.lastAuditedOn && !cell.nextPlannedOn) {
    return <span className="block px-2 py-1.5 text-xs text-muted-foreground">Nicht zertifiziert</span>;
  }
  const gap = isGap(c);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Details: ${label}`}
      className={cn(
        "flex w-full flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
      )}
    >
      {!c.certified && <span className="text-muted-foreground">Nicht zertifiziert</span>}
      {cell.lastAuditedOn ? (
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5 text-success" aria-hidden />
          <span>Auditiert</span>
          <span className="tnum text-muted-foreground">{formatDate(cell.lastAuditedOn)}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 font-medium text-warning-ink">
          <AlertTriangle className="size-3.5" aria-hidden />
          Nie auditiert
        </span>
      )}
      {cell.nextPlannedOn ? (
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <CalendarClock className="size-3.5 text-primary" aria-hidden />
          <span>Geplant</span>
          <span className="tnum text-muted-foreground">{formatDate(cell.nextPlannedOn)}</span>
          {nextAudit && <span className="tnum font-medium">{nextAudit.number}</span>}
          {gap && nextAudit && <RiskBadge level={nextAudit.planningRationale.riskLevel} />}
        </span>
      ) : (
        <span className="pl-5 text-muted-foreground">Nichts geplant</span>
      )}
    </button>
  );
}
