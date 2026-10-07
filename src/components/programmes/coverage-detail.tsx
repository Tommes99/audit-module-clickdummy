"use client";

import { useMemo } from "react";
import { EntityChip } from "@/components/shared/entity-chip";
import { RiskBadge } from "@/components/shared/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/store/app-store";
import { formatDate } from "@/domain/labels";
import { isGap, type RowCell } from "@/components/programmes/coverage-cell";
import type { CoverageRow } from "@/store/selectors";

export interface CoverageSelection {
  row: CoverageRow;
  cell: RowCell;
}

/** Detailansicht einer Matrixzelle: zuletzt auditiert, nächstes Audit mit Begründung der Risikoeinstufung */
export function CoverageDetail({ selection, onClose }: { selection: CoverageSelection | null; onClose: () => void }) {
  const data = useAppStore((s) => s.data);
  const nextAudit = useMemo(
    () => data.audits.find((a) => a.id === selection?.cell.cell.nextPlannedAuditId),
    [data, selection],
  );
  const site = data.sites.find((s) => s.id === selection?.cell.siteId);
  const cell = selection?.cell.cell;

  return (
    <Sheet open={selection !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="gap-0 sm:max-w-md">
        {selection && cell && (
          <>
            <SheetHeader className="border-b border-border pr-12">
              <SheetTitle>
                {selection.row.standardCode} {selection.row.requirement.clause}
              </SheetTitle>
              <SheetDescription>
                {selection.row.requirement.title}, {site?.name}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Zuletzt auditiert</h3>
                {cell.lastAuditedOn && cell.lastAuditId ? (
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="tnum">{formatDate(cell.lastAuditedOn)}</span>
                    <EntityChip kind="audit" id={cell.lastAuditId} className="whitespace-nowrap" />
                  </p>
                ) : (
                  <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-warning-ink">
                    {isGap(selection.cell)
                      ? "Noch nie auditiert: Kein freigegebenes Audit deckt dieses Kapitel am Standort ab."
                      : "Nicht zertifiziert: Der Standort ist nicht nach dieser Norm zertifiziert."}
                  </p>
                )}
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Nächstes geplantes Audit</h3>
                {cell.nextPlannedOn && nextAudit ? (
                  <div className="space-y-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="tnum">{formatDate(cell.nextPlannedOn)}</span>
                      <EntityChip kind="audit" id={nextAudit.id} className="whitespace-nowrap" />
                    </p>
                    <div className="space-y-1.5 rounded-lg border border-border p-3">
                      <p className="flex items-center gap-2 text-xs font-semibold">
                        Begründung der Risikoeinstufung <RiskBadge level={nextAudit.planningRationale.riskLevel} />
                      </p>
                      <ul className="list-disc space-y-1 pl-4">
                        {nextAudit.planningRationale.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nichts geplant. Nehmen Sie das Kapitel in ein künftiges Audit auf.</p>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
