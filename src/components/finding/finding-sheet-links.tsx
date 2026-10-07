"use client";

import { X } from "lucide-react";
import { AiSuggestionPanel } from "@/components/shared/ai-suggestion-panel";
import { EntityChip } from "@/components/shared/entity-chip";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/app-store";
import type { FindingLinks, ID } from "@/types/domain";
import { AI_AUDIT_ID, AI_KEY_LINKS, type FindingForm, type FormPatch } from "./finding-sheet-types";

interface LinksProps {
  auditId: string;
  auditNumber: string;
  form: FindingForm;
  patch: FormPatch;
}

function RemovableChip({ kind, id, onRemove }: { kind: "risk" | "kpi"; id: ID; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 [&_.tnum]:shrink-0 [&_.tnum]:whitespace-nowrap">
      <EntityChip kind={kind} id={id} />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Verknüpfung entfernen"
        className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-danger focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

/** Verknüpfungen zu Risiken und Kennzahlen: KI-Vorschlag oder manuelle Auswahl, entfernbar */
export function FindingSheetLinks({ auditId, auditNumber, form, patch }: LinksProps) {
  const risks = useAppStore((s) => s.data.risks);
  const kpis = useAppStore((s) => s.data.kpis);
  const rejectAiSuggestion = useAppStore((s) => s.rejectAiSuggestion);
  const hasAi = auditId === AI_AUDIT_ID;
  const { links } = form;

  const setLinks = (next: Partial<FindingLinks>) => patch({ links: { ...links, ...next } });
  const toggle = (list: ID[], id: ID, checked: boolean) => (checked ? [...new Set([...list, id])] : list.filter((x) => x !== id));
  const applyAi = (output: Record<string, string | string[]>) =>
    patch({
      links: {
        riskIds: [...new Set([...links.riskIds, ...((output.riskIds as string[]) ?? [])])],
        kpiIds: [...new Set([...links.kpiIds, ...((output.kpiIds as string[]) ?? [])])],
      },
      aiKeys: form.aiKeys.includes(AI_KEY_LINKS) ? form.aiKeys : [...form.aiKeys, AI_KEY_LINKS],
    });

  const empty = links.riskIds.length === 0 && links.kpiIds.length === 0;

  return (
    <div className="space-y-3">
      {hasAi && (
        <AiSuggestionPanel
          suggestionKey={AI_KEY_LINKS}
          triggerLabel="Verknüpfungen vorschlagen"
          accepted={form.aiKeys.includes(AI_KEY_LINKS)}
          onAccept={applyAi}
          onEdit={applyAi}
          onReject={() => rejectAiSuggestion(AI_KEY_LINKS, { entityType: "audit", entityId: auditId, auditId, label: auditNumber })}
        />
      )}
      {empty ? (
        <p className="text-sm text-muted-foreground">Noch keine Verknüpfung. Optional: Risiko oder Kennzahl zuordnen.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.riskIds.map((id) => (
            <RemovableChip key={id} kind="risk" id={id} onRemove={() => setLinks({ riskIds: links.riskIds.filter((x) => x !== id) })} />
          ))}
          {links.kpiIds.map((id) => (
            <RemovableChip key={id} kind="kpi" id={id} onRemove={() => setLinks({ kpiIds: links.kpiIds.filter((x) => x !== id) })} />
          ))}
        </div>
      )}
      <details className="rounded-lg border border-border">
        <summary className="min-h-9 cursor-pointer px-3 py-2 text-sm font-medium text-primary">Risiken und Kennzahlen manuell auswählen</summary>
        <div className="max-h-48 space-y-3 overflow-y-auto border-t border-border p-2">
          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-muted-foreground">Risiken</legend>
            {risks.map((r) => (
              <label key={r.id} className="flex min-h-9 cursor-pointer items-start gap-2 px-1 py-1 text-sm hover:bg-muted">
                <Checkbox className="mt-0.5" checked={links.riskIds.includes(r.id)} onCheckedChange={(c) => setLinks({ riskIds: toggle(links.riskIds, r.id, c === true) })} />
                <span><span className="tnum font-medium">{r.code}</span> <span className="text-muted-foreground">{r.title}</span></span>
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-muted-foreground">Kennzahlen</legend>
            {kpis.map((k) => (
              <label key={k.id} className="flex min-h-9 cursor-pointer items-start gap-2 px-1 py-1 text-sm hover:bg-muted">
                <Checkbox className="mt-0.5" checked={links.kpiIds.includes(k.id)} onCheckedChange={(c) => setLinks({ kpiIds: toggle(links.kpiIds, k.id, c === true) })} />
                <span><span className="tnum font-medium">{k.code}</span> <span className="text-muted-foreground">{k.name}</span></span>
              </label>
            ))}
          </fieldset>
        </div>
      </details>
    </div>
  );
}
