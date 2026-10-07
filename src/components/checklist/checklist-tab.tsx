"use client";

import { useMemo, useState } from "react";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { GuardHint } from "@/components/shared/guard-hint";
import { FindingSheet } from "@/components/finding/finding-sheet";
import { useCan } from "@/hooks/use-can";
import { checkRatingAllowed, isAuditContentLocked } from "@/domain/rules";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { auditChecklist, checklistProgress, itemNumbers } from "@/store/selectors";
import { ChecklistCreate } from "./checklist-create";
import { ChecklistHeader } from "./checklist-header";
import { ChecklistItemRow } from "./checklist-item-row";
import { MarkConformButton } from "./mark-conform-button";

type Filter = "all" | "open" | "deviation";

export function ChecklistTab({ auditId }: { auditId: string }) {
  const data = useAppStore((s) => s.data);
  const can = useCan();
  const [filter, setFilter] = useState<Filter>("all");
  const [findingItemId, setFindingItemId] = useState<string | null>(null);

  const audit = useMemo(() => data.audits.find((a) => a.id === auditId), [data.audits, auditId]);
  const checklist = useMemo(() => (audit ? auditChecklist(data, audit) : undefined), [data, audit]);
  const progress = useMemo(() => checklistProgress(checklist), [checklist]);
  const numbers = useMemo(() => (checklist ? itemNumbers(checklist) : new Map<string, string>()), [checklist]);

  if (!audit) return <EmptyState>Audit nicht gefunden. Wählen Sie ein Audit aus dem Programm.</EmptyState>;
  if (!checklist) return <ChecklistCreate audit={audit} />;

  const locked = isAuditContentLocked(audit);
  const checklistPermission = can("edit_checklist", { audit });
  const evidencePermission = can("provide_evidence", { audit });
  const hints: string[] = [];
  hints.push(...checkRatingAllowed(audit));
  if (!checklistPermission.allowed && checklistPermission.reason) hints.push(`Bewerten nicht möglich: ${checklistPermission.reason}.`);

  const canRate = hints.length === 0;
  const canEvidence = evidencePermission.allowed && !locked;
  const canCreateFinding = checklistPermission.allowed && audit.status === "in_progress";

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Alle", count: progress.total },
    { key: "open", label: "Unbewertet", count: progress.open },
    { key: "deviation", label: "Abweichungen", count: progress.deviations },
  ];
  const visible = checklist.items.filter((i) =>
    filter === "all" ? true : filter === "open" ? i.rating === null : i.rating === "deviation",
  );

  return (
    <div className="space-y-4">
      <SectionTitle help="audit.checklist" actions={<MarkConformButton checklistId={checklist.id} openCount={progress.open} disabledReasons={hints} />}>
        Checkliste
      </SectionTitle>
      <ChecklistHeader checklist={checklist} progress={progress} />
      <GuardHint blockers={hints} />

      <div role="group" aria-label="Filter" className="inline-flex overflow-hidden rounded-lg border border-border bg-card">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "min-h-10 border-r border-border px-4 text-sm outline-none transition-colors last:border-r-0 focus-visible:ring-3 focus-visible:ring-ring/50",
              filter === f.key ? "bg-info-soft font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {f.label} <span className="tnum">({f.count})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          {filter === "open" ? "Alle Punkte sind bewertet." : "Keine Abweichungen bewertet. Bewerten Sie einen Punkt mit Abweichung."}
        </EmptyState>
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-border">
            {visible.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                number={numbers.get(item.id) ?? ""}
                canRate={canRate}
                canEvidence={canEvidence}
                evidenceDeniedReason={locked ? "Das Audit ist gesperrt" : evidencePermission.reason}
                canCreateFinding={canCreateFinding}
                findingDeniedReason={checklistPermission.allowed ? "Feststellungen werden während der Durchführung erfasst" : checklistPermission.reason}
                onCreateFinding={setFindingItemId}
              />
            ))}
          </ul>
        </Panel>
      )}

      <FindingSheet
        open={findingItemId !== null}
        onOpenChange={(o) => !o && setFindingItemId(null)}
        auditId={audit.id}
        checklistItemId={findingItemId ?? ""}
      />
    </div>
  );
}
