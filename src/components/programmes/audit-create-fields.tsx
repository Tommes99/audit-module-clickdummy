"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/shared/native-select";
import { SheetField } from "@/components/finding/finding-sheet-section";
import { auditTypeLabels, riskLevelLabels } from "@/domain/labels";
import { isThirdPartyAudit } from "@/domain/rules";
import { useAppStore } from "@/store/app-store";
import type { AuditType, ID, RiskLevel } from "@/types/domain";
import type { AuditForm, AuditFormPatch } from "./audit-create-form";

interface FieldsProps {
  form: AuditForm;
  patch: AuditFormPatch;
}

const typeOptions = (Object.keys(auditTypeLabels) as AuditType[]).map((t) => ({ value: t, label: auditTypeLabels[t] }));
const riskOptions = (Object.keys(riskLevelLabels) as RiskLevel[]).map((r) => ({ value: r, label: riskLevelLabels[r].label }));

/** Mehrfachauswahl als Checkbox-Liste */
function CheckList({ legend, items, value, onChange }: { legend: string; items: { id: ID; label: string; hint?: string }[]; value: ID[]; onChange: (ids: ID[]) => void }) {
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-medium">
        {legend}
        <span className="text-danger" aria-hidden>
          *
        </span>
      </legend>
      {items.map((it) => (
        <label key={it.id} className="flex min-h-9 cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted">
          <Checkbox
            className="mt-0.5"
            checked={value.includes(it.id)}
            onCheckedChange={(c) => onChange(c === true ? [...new Set([...value, it.id])] : value.filter((x) => x !== it.id))}
          />
          <span>
            <span className="font-medium">{it.label}</span> {it.hint && <span className="text-muted-foreground">{it.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** Abschnitt 1: Art, Titel, Standort oder Lieferant, Zeitraum, Leitung */
export function AuditBasicsFields({ form, patch }: FieldsProps) {
  const sites = useAppStore((s) => s.data.sites);
  const persons = useAppStore((s) => s.data.persons);
  const processes = useAppStore((s) => s.data.processes);
  const supplier = form.type === "supplier";
  const auditors = persons.filter((p) => p.roles.includes("auditor")).map((p) => ({ value: p.id, label: p.name }));

  // Standortwechsel: Prozesse anderer Standorte fallen aus der Auswahl
  const onSite = (siteId: ID) =>
    patch({ siteId, processIds: form.processIds.filter((id) => processes.find((p) => p.id === id)?.siteIds.includes(siteId)) });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SheetField id="ac-type" label="Art" required>
          <NativeSelect id="ac-type" value={form.type} onChange={(v) => patch({ type: v as AuditType })} options={typeOptions} />
        </SheetField>
        {supplier ? (
          <SheetField id="ac-supplier" label="Lieferant" required>
            <Input id="ac-supplier" value={form.supplierName} onChange={(e) => patch({ supplierName: e.target.value })} />
          </SheetField>
        ) : (
          <SheetField id="ac-site" label="Standort" required>
            <NativeSelect id="ac-site" value={form.siteId} onChange={onSite} placeholder="Bitte wählen" options={sites.map((s) => ({ value: s.id, label: s.name }))} />
          </SheetField>
        )}
      </div>
      {isThirdPartyAudit(form) && (
        <SheetField id="ac-body" label="Zertifizierungsstelle">
          <Input id="ac-body" value={form.certificationBody} onChange={(e) => patch({ certificationBody: e.target.value })} />
        </SheetField>
      )}
      <SheetField id="ac-title" label="Titel" required>
        <Input id="ac-title" value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="z. B. Internes Audit Energiemanagement Leipzig" />
      </SheetField>
      <div className="grid gap-4 sm:grid-cols-3">
        <SheetField id="ac-start" label="Beginn" required>
          <Input id="ac-start" type="date" className="tnum" value={form.plannedStart} onChange={(e) => patch({ plannedStart: e.target.value, plannedEnd: form.plannedEnd || e.target.value })} />
        </SheetField>
        <SheetField id="ac-end" label="Ende" required>
          <Input id="ac-end" type="date" className="tnum" min={form.plannedStart || undefined} value={form.plannedEnd} onChange={(e) => patch({ plannedEnd: e.target.value })} />
        </SheetField>
        <SheetField id="ac-lead" label="Auditleitung" required>
          <NativeSelect id="ac-lead" value={form.leadAuditorId} onChange={(v) => patch({ leadAuditorId: v })} placeholder="Bitte wählen" options={auditors} />
        </SheetField>
      </div>
    </div>
  );
}

/** Abschnitt 2: Normen und Prozesse im Scope, Ziele und Umfang */
export function AuditScopeFields({ form, patch }: FieldsProps) {
  const standards = useAppStore((s) => s.data.standards);
  const processes = useAppStore((s) => s.data.processes);
  const persons = useAppStore((s) => s.data.persons);
  const available = useMemo(
    () => (form.type === "supplier" || !form.siteId ? processes : processes.filter((p) => p.siteIds.includes(form.siteId))),
    [processes, form.type, form.siteId],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CheckList
          legend="Normen"
          items={standards.map((s) => ({ id: s.id, label: s.code, hint: s.title }))}
          value={form.standardIds}
          onChange={(standardIds) => patch({ standardIds })}
        />
        <CheckList
          legend="Prozesse"
          items={available.map((p) => ({ id: p.id, label: p.name, hint: `(${persons.find((x) => x.id === p.ownerId)?.name ?? "ohne Verantwortliche"})` }))}
          value={form.processIds}
          onChange={(processIds) => patch({ processIds })}
        />
      </div>
      <SheetField id="ac-objectives" label="Ziele" required>
        <Textarea id="ac-objectives" rows={2} value={form.objectives} onChange={(e) => patch({ objectives: e.target.value })} />
      </SheetField>
      <SheetField id="ac-scope" label="Umfang" required>
        <Textarea id="ac-scope" rows={2} value={form.scopeDescription} onChange={(e) => patch({ scopeDescription: e.target.value })} placeholder="Bereiche, Abläufe, Standortteile" />
      </SheetField>
    </div>
  );
}

/** Abschnitt 3: Risikoeinstufung mit Begründung */
export function AuditRiskFields({ form, patch }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
      <SheetField id="ac-risk" label="Risikoeinstufung" required>
        <NativeSelect id="ac-risk" value={form.riskLevel} onChange={(v) => patch({ riskLevel: v as RiskLevel })} options={riskOptions} />
      </SheetField>
      <SheetField id="ac-reasons" label="Begründung (eine Zeile je Grund)" required>
        <Textarea id="ac-reasons" rows={3} value={form.riskReasons} onChange={(e) => patch({ riskReasons: e.target.value })} placeholder="z. B. Neue Anlage seit Q2, offene Abweichung aus dem Vorjahr" />
      </SheetField>
    </div>
  );
}
