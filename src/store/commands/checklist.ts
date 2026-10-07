import type { Audit, Checklist, ChecklistItem, ChecklistRating, EvidenceKind, ID, SeedData } from "@/types/domain";
import { checkRatingAllowed, isAuditContentLocked } from "@/domain/rules";
import { checklistRatingLabels, evidenceKindShortLabels } from "@/domain/labels";
import { demoNow } from "@/domain/workflows";
import { newId } from "@/domain/factories";
import { demoDigest } from "@/lib/hash";
import type { Session } from "@/domain/permissions";
import { emit, fail, replaceById, succeed, type CommandOutput } from "@/store/helpers";

export interface ItemLocation {
  checklist: Checklist;
  item: ChecklistItem;
  audit: Audit;
  /** Anzeigenummer: Katalogpunkt "4", Übernahme "Ü1", eigener Punkt "Z1" */
  number: string;
}

/** Nummerierung der Checklistenpunkte: Katalogfragen 1..n, Übernahmen Ü1.., eigene Punkte Z1.. */
export function itemNumbers(checklist: Checklist): Map<ID, string> {
  const counters = { catalog: 0, carry_over: 0, ad_hoc: 0 };
  const prefix = { catalog: "", carry_over: "Ü", ad_hoc: "Z" } as const;
  return new Map(
    checklist.items.map((item) => {
      counters[item.origin] += 1;
      return [item.id, `${prefix[item.origin]}${counters[item.origin]}`] as const;
    }),
  );
}

export function locateItem(data: SeedData, itemId: ID): ItemLocation | undefined {
  for (const checklist of data.checklists) {
    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) continue;
    const audit = data.audits.find((a) => a.id === checklist.auditId);
    if (!audit) return undefined;
    return { checklist, item, audit, number: itemNumbers(checklist).get(itemId) ?? itemId };
  }
  return undefined;
}

export function updateItem(data: SeedData, checklistId: ID, itemId: ID, patch: Partial<ChecklistItem>): SeedData {
  return {
    ...data,
    checklists: replaceById(data.checklists, checklistId, (c) => ({
      ...c,
      items: replaceById(c.items, itemId, patch),
    })),
  };
}


export function rateItem(
  data: SeedData,
  session: Session,
  itemId: ID,
  rating: ChecklistRating,
  notes?: string,
): CommandOutput {
  const loc = locateItem(data, itemId);
  if (!loc) return fail(data, ["Checklistenpunkt nicht gefunden."]);
  const blockers = checkRatingAllowed(loc.audit);
  if (blockers.length > 0) return fail(data, blockers);

  const nextNotes = notes ?? loc.item.notes;
  const next = emit(
    updateItem(data, loc.checklist.id, itemId, {
      rating,
      notes: nextNotes,
      ratedById: session.personId,
      ratedAt: demoNow(),
    }),
    session,
    {
      entityType: "checklist_item",
      entityId: itemId,
      auditId: loc.audit.id,
      action: "rated",
      summary: `Checklistenpunkt ${loc.number} in ${loc.audit.number} als "${checklistRatingLabels[rating].label}" bewertet`,
      changes: [
        { field: "rating", before: loc.item.rating, after: rating },
        ...(nextNotes !== loc.item.notes ? [{ field: "notes", before: loc.item.notes, after: nextNotes }] : []),
      ],
    },
  );
  return succeed(next);
}

/** Notiz ohne Bewertungsänderung. Auch Kleinigkeiten laufen über den Audit-Trail. */
export function setItemNotes(data: SeedData, session: Session, itemId: ID, notes: string): CommandOutput {
  const loc = locateItem(data, itemId);
  if (!loc) return fail(data, ["Checklistenpunkt nicht gefunden."]);
  if (isAuditContentLocked(loc.audit)) return fail(data, ["Das Audit ist gesperrt."]);
  if (notes === loc.item.notes) return succeed(data);
  const next = emit(updateItem(data, loc.checklist.id, itemId, { notes }), session, {
    entityType: "checklist_item",
    entityId: itemId,
    auditId: loc.audit.id,
    action: "updated",
    summary: `Notiz zu Checklistenpunkt ${loc.number} in ${loc.audit.number} geändert`,
    changes: [{ field: "notes", before: loc.item.notes, after: notes }],
  });
  return succeed(next);
}

/** Nur Demo-Abkürzung: bewertet alle offenen Punkte als konform und loggt das ausdrücklich */
export function markRemainingConform(data: SeedData, session: Session, checklistId: ID): CommandOutput {
  const checklist = data.checklists.find((c) => c.id === checklistId);
  if (!checklist) return fail(data, ["Checkliste nicht gefunden."]);
  const audit = data.audits.find((a) => a.id === checklist.auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  const blockers = checkRatingAllowed(audit);
  if (blockers.length > 0) return fail(data, blockers);
  const open = checklist.items.filter((i) => i.rating === null);
  if (open.length === 0) return fail(data, ["Es gibt keine unbewerteten Punkte."]);

  const at = demoNow();
  const updated: Checklist = {
    ...checklist,
    items: checklist.items.map((i) =>
      i.rating === null ? { ...i, rating: "conform" as const, ratedById: session.personId, ratedAt: at } : i,
    ),
  };
  const next = emit({ ...data, checklists: replaceById(data.checklists, checklistId, updated) }, session, {
    entityType: "checklist",
    entityId: checklistId,
    auditId: audit.id,
    action: "rated",
    summary: `Demo-Abkürzung: ${open.length} Checklistenpunkte in ${audit.number} als konform markiert`,
    changes: [{ field: "unratedItems", before: open.length, after: 0 }],
  });
  return succeed(next);
}

export type EvidenceTarget =
  | { type: "checklist_item"; id: ID }
  | { type: "finding"; id: ID }
  | { type: "action"; id: ID };

export interface EvidenceDraft {
  kind: EvidenceKind;
  title: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  url?: string;
  containsPersonalData?: boolean;
}

export function attachEvidence(
  data: SeedData,
  session: Session,
  target: EvidenceTarget,
  draft: EvidenceDraft,
): CommandOutput {
  if (!draft.title.trim()) return fail(data, ["Titel des Nachweises angeben."]);

  let auditId: ID | undefined;
  let attach: (d: SeedData, evidenceId: ID) => SeedData;
  if (target.type === "checklist_item") {
    const loc = locateItem(data, target.id);
    if (!loc) return fail(data, ["Checklistenpunkt nicht gefunden."]);
    if (isAuditContentLocked(loc.audit)) return fail(data, ["Das Audit ist gesperrt."]);
    auditId = loc.audit.id;
    attach = (d, evId) => updateItem(d, loc.checklist.id, target.id, { evidenceIds: [...loc.item.evidenceIds, evId] });
  } else if (target.type === "finding") {
    const finding = data.findings.find((f) => f.id === target.id);
    if (!finding) return fail(data, ["Feststellung nicht gefunden."]);
    if (finding.status === "closed") return fail(data, ["Geschlossene Feststellungen sind nicht änderbar."]);
    auditId = finding.auditId;
    attach = (d, evId) => ({ ...d, findings: replaceById(d.findings, target.id, { evidenceIds: [...finding.evidenceIds, evId] }) });
  } else {
    const action = data.actions.find((a) => a.id === target.id);
    if (!action) return fail(data, ["Maßnahme nicht gefunden."]);
    const finding = data.findings.find((f) => f.id === action.source.id);
    if (finding?.status === "closed") return fail(data, ["Die Feststellung ist geschlossen, ihre Maßnahmen sind nicht mehr änderbar."]);
    auditId = finding?.auditId;
    if (!auditId) return fail(data, ["Zugehöriges Audit nicht gefunden."]);
    attach = (d, evId) => ({ ...d, actions: replaceById(d.actions, target.id, { evidenceIds: [...action.evidenceIds, evId] }) });
  }

  const id = newId("ev");
  const now = demoNow();
  const evidence = {
    id,
    auditId,
    kind: draft.kind,
    title: draft.title.trim(),
    fileName: draft.fileName,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
    url: draft.url,
    // Simulierter Upload: Dateiname und Größe übernehmen, Hash per Demo-Digest
    sha256: draft.kind === "document_link" ? undefined : demoDigest(`${id}:${draft.fileName ?? draft.title}:${draft.sizeBytes ?? 0}`),
    capturedAt: now,
    uploadedById: session.personId,
    uploadedAt: now,
    containsPersonalData: draft.containsPersonalData ?? draft.kind === "interview_note",
  };
  const withEvidence = attach({ ...data, evidence: [...data.evidence, evidence] }, id);
  const next = emit(withEvidence, session, {
    entityType: "evidence",
    entityId: id,
    auditId,
    action: "evidence_attached",
    summary: `${evidenceKindShortLabels[draft.kind]} "${evidence.title}" als Nachweis angehängt`,
  });
  return succeed(next, [], id);
}
