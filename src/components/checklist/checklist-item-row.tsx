"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EntityChip, EntityChips } from "@/components/shared/entity-chip";
import { GuardedButton } from "@/components/shared/guarded-button";
import { HelpHint } from "@/components/shared/help-hint";
import { checklistRatingLabels } from "@/domain/labels";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { ChecklistItem } from "@/types/domain";
import { ChecklistEvidenceLine } from "./checklist-evidence-line";
import { ChecklistItemDetails } from "./checklist-item-details";
import { RatingButtons } from "./rating-buttons";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  number: string;
  /** Bewerten und Notizen erlaubt (Status, Sperre und Berechtigung bereits geprüft) */
  canRate: boolean;
  /** Nachweise anhängen erlaubt (Berechtigung provide_evidence, Audit nicht gesperrt) */
  canEvidence: boolean;
  evidenceDeniedReason?: string;
  canCreateFinding: boolean;
  findingDeniedReason?: string;
  onCreateFinding: (itemId: string) => void;
}

/** Ein Checklistenpunkt als ruhige Zeile: Frage, Bewertung direkt daneben, Notiz und Nachweise eingeklappt */
export function ChecklistItemRow(props: ChecklistItemRowProps) {
  const { item, number, canRate, canEvidence, evidenceDeniedReason, canCreateFinding, findingDeniedReason, onCreateFinding } = props;
  const rateItem = useAppStore((s) => s.rateItem);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  // Anker #ci-... öffnet den Punkt und scrollt hin
  useEffect(() => {
    const check = () => {
      if (window.location.hash !== `#${item.id}`) return;
      setOpen(true);
      requestAnimationFrame(() => ref.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [item.id]);

  const isCarryOver = item.origin === "carry_over";
  const evidenceCount = item.evidenceIds.length;
  const summary = [item.notes.trim() ? "Notiz" : "", evidenceCount > 0 ? `${evidenceCount} ${evidenceCount === 1 ? "Nachweis" : "Nachweise"}` : ""]
    .filter(Boolean)
    .join(", ");
  const findingButtonInRow = item.rating === "deviation" && item.findingIds.length === 0 && canCreateFinding;

  return (
    <li id={item.id} ref={ref} className={cn("scroll-mt-20", isCarryOver && "bg-muted/40")}>
      <div className="grid gap-x-6 gap-y-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 gap-3">
          <span className="tnum w-7 shrink-0 pt-px font-semibold text-muted-foreground">{number}</span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-medium leading-snug">{item.text}</p>
            {isCarryOver && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  Übernahme <HelpHint topic="audit.carryOver" />
                </span>
                {item.carriedOverFindingId && <EntityChip kind="finding" id={item.carriedOverFindingId} />}
              </p>
            )}
            <ChecklistEvidenceLine evidenceIds={item.evidenceIds} />
            {item.findingIds.length > 0 && <EntityChips kind="finding" ids={item.findingIds} />}
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${item.id}-panel`}
              onClick={() => setOpen((o) => !o)}
              className="-ml-1 inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-xs font-medium text-primary outline-none hover:bg-info-soft focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {open ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
              Notiz und Nachweise
              {summary && <span className="tnum font-normal text-muted-foreground">({summary})</span>}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <RatingButtons
            value={item.rating}
            disabled={!canRate}
            onRate={(rating) => notify(rateItem(item.id, rating), `Punkt ${number} bewertet: ${checklistRatingLabels[rating].label}`)}
          />
          {findingButtonInRow && (
            <GuardedButton type="button" className="min-h-11 w-full" onClick={() => onCreateFinding(item.id)}>
              Feststellung anlegen
            </GuardedButton>
          )}
        </div>
      </div>
      {open && (
        <ChecklistItemDetails
          id={`${item.id}-panel`}
          item={item}
          canRate={canRate}
          canEvidence={canEvidence}
          evidenceDeniedReason={evidenceDeniedReason}
          findingButtonInRow={findingButtonInRow}
          canCreateFinding={canCreateFinding}
          findingDeniedReason={findingDeniedReason}
          onCreateFinding={() => onCreateFinding(item.id)}
        />
      )}
    </li>
  );
}
