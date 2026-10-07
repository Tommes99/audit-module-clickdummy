"use client";

import { useMemo, useState } from "react";
import { GuardHint } from "@/components/shared/guard-hint";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/shared/guarded-button";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCan } from "@/hooks/use-can";
import { findingClassificationLabels } from "@/domain/labels";
import { checkFindingTransition, suggestProcessForItem } from "@/domain/rules";
import { demoNow } from "@/domain/workflows";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";
import { locateItem } from "@/store/commands/checklist";
import type { Finding, ID } from "@/types/domain";
import { FindingSheetClassification, FindingSheetDescription } from "./finding-sheet-fields";
import { FindingSheetLinks } from "./finding-sheet-links";
import { FindingSheetRefs } from "./finding-sheet-refs";
import { SheetSection } from "./finding-sheet-section";
import { computeFieldErrors } from "./finding-sheet-errors";
import type { FieldKey, FindingForm, FormPatch } from "./finding-sheet-types";

interface BodyProps {
  auditId: string;
  checklistItemId: string;
  onClose: () => void;
}

export function FindingSheetBody({ auditId, checklistItemId, onClose }: BodyProps) {
  const data = useAppStore((s) => s.data);
  const session = useAppStore((s) => s.session);
  const createFinding = useAppStore((s) => s.createFinding);
  const transitionFinding = useAppStore((s) => s.transitionFinding);
  const can = useCan();

  const audit = useMemo(() => data.audits.find((a) => a.id === auditId), [data.audits, auditId]);
  const loc = useMemo(() => locateItem(data, checklistItemId), [data, checklistItemId]);

  // Vorbelegung einmalig beim Öffnen: Anforderungen und Prozess aus dem Punkt, Verantwortliche:r aus dem Prozess
  const [form, setForm] = useState<FindingForm>(() => {
    const processId = audit && loc ? (suggestProcessForItem(loc.item, audit, data.planSlots, data.findings) ?? "") : "";
    return {
      statement: loc?.item.notes ?? "",
      title: "",
      description: "",
      classification: "",
      requirementIds: loc ? loc.item.requirementIds.filter((r) => audit?.requirementIds.includes(r)) : [],
      processId,
      ownerId: data.processes.find((p) => p.id === processId)?.ownerId ?? "",
      ownerTouched: false,
      dueDate: "",
      links: { riskIds: [], kpiIds: [] },
      aiKeys: [],
      touched: {},
    };
  });
  const patch: FormPatch = (p) => setForm((f) => ({ ...f, ...p }));
  const touch = (key: FieldKey) => setForm((f) => (f.touched[key] ? f : { ...f, touched: { ...f.touched, [key]: true } }));

  const onProcessChange = (processId: ID) =>
    setForm((f) => ({
      ...f,
      processId,
      ownerId: f.ownerTouched ? f.ownerId : (data.processes.find((p) => p.id === processId)?.ownerId ?? ""),
    }));
  const onOwnerChange = (ownerId: ID) => patch({ ownerId, ownerTouched: true });

  // Simulierte Prüfung "Offen setzen" auf dem Formularstand, die Regeln stehen in rules.ts
  const guard = useMemo(() => {
    if (!audit || !loc) return { ok: false, blockers: [] as string[], warnings: [] as string[] };
    const draftFinding: Finding = {
      id: "draft-preview",
      number: "",
      auditId,
      // Ohne Auswahl wird wie eine Beobachtung geprüft, die fehlende Klassifizierung meldet das Formular separat
      classification: form.classification || "observation",
      status: "draft",
      title: form.title,
      description: form.description,
      requirementIds: form.requirementIds,
      siteId: audit.siteId,
      processId: form.processId,
      checklistItemId,
      evidenceIds: loc.item.evidenceIds,
      raisedById: session.personId,
      raisedAt: demoNow(),
      ownerId: form.ownerId || undefined,
      dueDate: form.dueDate || undefined,
      actionIds: [],
      links: form.links,
      aiAssisted: form.aiKeys.length > 0,
    };
    return checkFindingTransition(draftFinding, "open", data);
  }, [audit, loc, form, data, auditId, checklistItemId, session.personId]);

  if (!audit || !loc) {
    return (
      <SheetHeader>
        <SheetTitle>Feststellung anlegen</SheetTitle>
        <SheetDescription>Checklistenpunkt nicht gefunden. Schließen Sie das Fenster und wählen Sie einen Punkt.</SheetDescription>
      </SheetHeader>
    );
  }

  const permission = can("edit_checklist", { audit });
  const draftBlockers: string[] = [];
  if (!form.classification) draftBlockers.push("Klassifizierung wählen.");
  if (!form.title.trim()) draftBlockers.push("Kurztitel angeben.");
  if (form.requirementIds.length === 0) draftBlockers.push("Mindestens eine Normanforderung zuordnen.");
  if (!form.processId) draftBlockers.push("Prozess zuordnen.");
  const openBlockers = [...new Set([...draftBlockers, ...guard.blockers])];

  const errors = computeFieldErrors(form);

  const submit = (setOpen: boolean) => {
    if (!form.classification) return;
    const created = createFinding({
      auditId,
      checklistItemId,
      classification: form.classification,
      title: form.title,
      description: form.description,
      requirementIds: form.requirementIds,
      processId: form.processId,
      ownerId: form.ownerId || undefined,
      dueDate: form.dueDate || undefined,
      links: form.links,
      aiKeys: form.aiKeys,
    });
    if (!notify(created) || !created.createdId) return;
    const number = useAppStore.getState().data.findings.find((f) => f.id === created.createdId)?.number ?? "";
    const message = `${findingClassificationLabels[form.classification].label} ${number} erfasst`;
    if (setOpen) {
      if (!notify(transitionFinding(created.createdId, "open"), message)) return;
    } else {
      notify({ ok: true, blockers: [], warnings: [] }, message);
    }
    onClose();
  };

  return (
    <>
      <SheetHeader className="border-b border-border pr-12">
        <SheetTitle>Feststellung anlegen</SheetTitle>
        <SheetDescription>
          <span className="tnum">{audit.number}</span>, Punkt <span className="tnum">{loc.number}</span>: {loc.item.text}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-5">
        <SheetSection step={1} title="Bezug">
          <FindingSheetRefs
            audit={audit}
            item={loc.item}
            form={form}
            patch={patch}
            errors={errors}
            touch={touch}
            onProcessChange={onProcessChange}
            evidenceDeniedReason={can("provide_evidence", { audit }).reason}
          />
        </SheetSection>
        <SheetSection step={2} title="Beschreibung" help="finding.ai">
          <FindingSheetDescription auditId={auditId} auditNumber={audit.number} form={form} patch={patch} errors={errors} touch={touch} />
        </SheetSection>
        <SheetSection step={3} title="Klassifizierung und Zuständigkeit">
          <FindingSheetClassification form={form} patch={patch} errors={errors} touch={touch} onOwnerChange={onOwnerChange} />
        </SheetSection>
        <SheetSection step={4} title="Verknüpfungen">
          <FindingSheetLinks auditId={auditId} auditNumber={audit.number} form={form} patch={patch} />
        </SheetSection>
      </div>

      <SheetFooter className="border-t border-border bg-card">
        {openBlockers.length > 0 && (
          <p role="status" className="text-xs text-danger-ink">
            <span className="font-medium">Noch offen:</span> {openBlockers.join(" ")}
          </p>
        )}
        {guard.warnings.length > 0 && (
          <div className="max-h-24 overflow-y-auto">
            <GuardHint warnings={guard.warnings} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <GuardedButton type="button" variant="outline" deniedReason={permission.reason} blockers={draftBlockers} onClick={() => submit(false)}>
            Als Entwurf speichern
          </GuardedButton>
          <GuardedButton type="button" deniedReason={permission.reason} blockers={openBlockers} onClick={() => submit(true)}>
            Speichern
          </GuardedButton>
        </div>
      </SheetFooter>
    </>
  );
}
