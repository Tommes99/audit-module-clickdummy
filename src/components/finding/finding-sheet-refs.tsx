"use client";

import { useMemo } from "react";
import { AttachEvidenceButton } from "@/components/shared/attach-evidence-button";
import { EvidenceList } from "@/components/shared/evidence-list";
import { NativeSelect } from "@/components/shared/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveEntity } from "@/store/selectors";
import { useAppStore } from "@/store/app-store";
import type { Audit, ChecklistItem, ID } from "@/types/domain";
import { SheetField } from "./finding-sheet-section";
import type { FieldErrors, FindingForm, FormPatch, Touch } from "./finding-sheet-types";

interface RefsProps {
  audit: Audit;
  item: ChecklistItem;
  form: FindingForm;
  patch: FormPatch;
  errors: FieldErrors;
  touch: Touch;
  onProcessChange: (processId: ID) => void;
  evidenceDeniedReason?: string;
}

/** Pflichtbezüge: Anforderungen (Mehrfachauswahl nach Norm), Prozess, Standort, Nachweise des Punktes */
export function FindingSheetRefs({ audit, item, form, patch, errors, touch, onProcessChange, evidenceDeniedReason }: RefsProps) {
  const data = useAppStore((s) => s.data);

  // Normen mit den Anforderungen des Punktes zuerst, dort die Anforderungen des Punktes oben
  const groups = useMemo(() => {
    const own = (id: ID) => item.requirementIds.includes(id);
    return audit.standardIds
      .map((sid) => ({
        standard: data.standards.find((s) => s.id === sid),
        requirements: data.requirements
          .filter((r) => r.standardId === sid && audit.requirementIds.includes(r.id))
          .sort((a, b) => Number(own(b.id)) - Number(own(a.id))),
      }))
      .sort((a, b) => Number(b.requirements.some((r) => own(r.id))) - Number(a.requirements.some((r) => own(r.id))));
  }, [data.standards, data.requirements, audit.standardIds, audit.requirementIds, item.requirementIds]);

  const toggle = (id: ID, checked: boolean) => {
    touch("requirements");
    patch({ requirementIds: checked ? [...form.requirementIds, id] : form.requirementIds.filter((r) => r !== id) });
  };

  const site = audit.siteId ? data.sites.find((s) => s.id === audit.siteId)?.name : `Lieferant: ${audit.supplierName ?? "unbekannt"}`;

  return (
    <div className="space-y-4">
      <SheetField id="fs-requirements" label="Anforderungen" required error={errors.requirements}>
        <div
          id="fs-requirements"
          role="group"
          aria-label="Anforderungen"
          className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-2"
        >
          {groups.map(({ standard, requirements }) => (
            <fieldset key={standard?.id} className="space-y-0.5">
              <legend className="px-1 text-xs font-semibold text-muted-foreground">{standard?.code}</legend>
              {requirements.map((r) => {
                const e = resolveEntity(data, "requirement", r.id);
                return (
                  <label key={r.id} className="flex min-h-9 cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted">
                    <Checkbox className="mt-0.5" checked={form.requirementIds.includes(r.id)} onCheckedChange={(c) => toggle(r.id, c === true)} />
                    <span>
                      <span className="tnum font-medium">{e.label}</span> <span className="text-muted-foreground">{e.title}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
      </SheetField>

      <div className="grid gap-4 sm:grid-cols-2">
        <SheetField id="fs-process" label="Prozess" required error={errors.process}>
          <NativeSelect
            id="fs-process"
            value={form.processId}
            onChange={onProcessChange}
            onBlur={() => touch("process")}
            aria-invalid={Boolean(errors.process)}
            placeholder="Bitte wählen"
            options={audit.processIds.map((pid) => ({ value: pid, label: resolveEntity(data, "process", pid).label }))}
          />
        </SheetField>
        <div className="space-y-1.5">
          <p className="flex h-3.5 items-center text-sm font-medium">Standort</p>
          <p className="flex h-9 items-center rounded-lg border border-border bg-muted/40 px-2.5 text-sm">{site}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Nachweise des Punktes</p>
        <EvidenceList evidenceIds={item.evidenceIds} emptyText="Noch kein Nachweis am Punkt. Ohne Nachweis erscheint bei Abweichungen eine Warnung." />
        <AttachEvidenceButton target={{ type: "checklist_item", id: item.id }} label="Nachweis anhängen" defaultKind="photo" deniedReason={evidenceDeniedReason} />
      </div>
    </div>
  );
}
