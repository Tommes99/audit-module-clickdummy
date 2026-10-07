"use client";

import { AttachEvidenceButton } from "@/components/shared/attach-evidence-button";
import { EntityChips } from "@/components/shared/entity-chip";
import { EvidenceList } from "@/components/shared/evidence-list";
import { GuardedButton } from "@/components/shared/guarded-button";
import { formatDateTime } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import type { ChecklistItem } from "@/types/domain";
import { ChecklistItemNotes } from "./checklist-item-notes";

interface ChecklistItemDetailsProps {
  id: string;
  item: ChecklistItem;
  canRate: boolean;
  canEvidence: boolean;
  evidenceDeniedReason?: string;
  /** Der Button "Feststellung anlegen" steht bereits in der Zeile (Abweichung ohne Feststellung) */
  findingButtonInRow: boolean;
  canCreateFinding: boolean;
  findingDeniedReason?: string;
  onCreateFinding: () => void;
}

/** Aufgeklappter Bereich eines Punkts: Bezüge, Notiz, Nachweise, Feststellungen */
export function ChecklistItemDetails(props: ChecklistItemDetailsProps) {
  const { id, item, canRate, canEvidence, evidenceDeniedReason, findingButtonInRow, canCreateFinding, findingDeniedReason, onCreateFinding } = props;
  const data = useAppStore((s) => s.data);
  const rated = item.rating !== null;
  const target = { type: "checklist_item", id: item.id } as const;

  return (
    <div id={id} className="space-y-5 border-t border-border bg-muted/30 px-4 py-4">
      <div className="space-y-1.5 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Anforderungen</span>
          <EntityChips kind="requirement" ids={item.requirementIds} />
        </div>
        {item.guidance && <p className="max-w-[72ch] text-muted-foreground">{item.guidance}</p>}
        {item.evidenceHint && <p className="max-w-[72ch] text-muted-foreground">Typische Nachweise: {item.evidenceHint}</p>}
        {item.ratedById && item.ratedAt && (
          <p className="text-xs text-muted-foreground">
            Bewertet von {personName(data, item.ratedById)}, <span className="tnum">{formatDateTime(item.ratedAt)}</span>
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChecklistItemNotes itemId={item.id} notes={item.notes} disabled={!canRate} />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Nachweise</h3>
          <EvidenceList evidenceIds={item.evidenceIds} emptyText="Noch kein Nachweis. Hängen Sie ein Foto oder eine Datei an." />
          <div className="flex flex-wrap gap-2">
            <AttachEvidenceButton target={target} label="Foto anhängen" defaultKind="photo" deniedReason={canEvidence ? undefined : evidenceDeniedReason} />
            <AttachEvidenceButton target={target} label="Nachweis anhängen" defaultKind="file" deniedReason={canEvidence ? undefined : evidenceDeniedReason} />
          </div>
        </div>
      </div>

      {(item.findingIds.length > 0 || !findingButtonInRow) && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Feststellungen</h3>
          {item.findingIds.length > 0 && <EntityChips kind="finding" ids={item.findingIds} />}
          {!findingButtonInRow && (
            <GuardedButton
              type="button"
              variant="outline"
              className="min-h-11"
              blockers={!rated ? ["Punkt zuerst bewerten"] : []}
              deniedReason={rated && !canCreateFinding ? findingDeniedReason : undefined}
              onClick={onCreateFinding}
            >
              Feststellung anlegen
            </GuardedButton>
          )}
        </div>
      )}
    </div>
  );
}
