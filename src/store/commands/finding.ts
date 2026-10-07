import type {
  Finding,
  FindingClassification,
  FindingLinks,
  FindingStatus,
  ID,
  RootCauseMethod,
  SeedData,
} from "@/types/domain";
import { checkFindingTransition, isAuditContentLocked, requirementsOutsideScope, requiresCapa } from "@/domain/rules";
import { findingClassificationLabels, findingStatusLabels } from "@/domain/labels";
import { DEMO_TODAY, demoNow, requiresReason } from "@/domain/workflows";
import { nextNumber, newId } from "@/domain/factories";
import type { Session } from "@/domain/permissions";
import { emit, fail, reasonMissing, replaceById, succeed, type CommandOutput } from "@/store/helpers";
import { emitAiDecision } from "@/store/commands/ai";
import { locateItem, updateItem } from "@/store/commands/checklist";

const year = () => Number(DEMO_TODAY.slice(0, 4));

export interface FindingDraft {
  auditId: ID;
  checklistItemId?: ID;
  classification: FindingClassification;
  title: string;
  description: string;
  requirementIds: ID[];
  processId: ID;
  ownerId?: ID;
  dueDate?: string;
  evidenceIds?: ID[];
  links?: Partial<FindingLinks>;
  /** Übernommene KI-Vorschläge (Schlüssel aus ai-suggestions.ts), erzeugen je ein Event */
  aiKeys?: string[];
}

export function createFinding(data: SeedData, session: Session, draft: FindingDraft): CommandOutput {
  const audit = data.audits.find((a) => a.id === draft.auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  const blockers: string[] = [];
  if (audit.status !== "in_progress") blockers.push("Feststellungen werden während der Durchführung erfasst.");
  if (!draft.title.trim()) blockers.push("Kurztitel angeben.");
  if (draft.requirementIds.length === 0) blockers.push("Mindestens eine Normanforderung zuordnen.");
  if (!draft.processId) blockers.push("Prozess zuordnen.");
  blockers.push(...requirementsOutsideScope(draft.requirementIds, audit, data));

  const loc = draft.checklistItemId ? locateItem(data, draft.checklistItemId) : undefined;
  if (draft.checklistItemId) {
    if (!loc) blockers.push("Checklistenpunkt nicht gefunden.");
    else if (loc.item.rating === null) blockers.push("Checklistenpunkt zuerst bewerten.");
  }
  if (blockers.length > 0) return fail(data, blockers);

  const id = newId("f");
  const number = nextNumber("F", year(), data.findings.map((f) => f.number));
  const evidenceIds = [...new Set([...(loc?.item.evidenceIds ?? []), ...(draft.evidenceIds ?? [])])];
  const finding: Finding = {
    id,
    number,
    auditId: audit.id,
    classification: draft.classification,
    status: "draft",
    title: draft.title.trim(),
    description: draft.description.trim(),
    requirementIds: draft.requirementIds,
    siteId: audit.siteId,
    processId: draft.processId,
    checklistItemId: draft.checklistItemId,
    evidenceIds,
    raisedById: session.personId,
    raisedAt: demoNow(),
    ownerId: draft.ownerId,
    dueDate: draft.dueDate,
    actionIds: [],
    links: { riskIds: draft.links?.riskIds ?? [], kpiIds: draft.links?.kpiIds ?? [] },
    carriedOverFromFindingId: loc?.item.carriedOverFindingId,
    aiAssisted: (draft.aiKeys ?? []).length > 0,
  };

  let next: SeedData = { ...data, findings: [...data.findings, finding] };
  if (loc) next = updateItem(next, loc.checklist.id, loc.item.id, { findingIds: [...loc.item.findingIds, id] });
  next = emit(next, session, {
    entityType: "finding",
    entityId: id,
    auditId: audit.id,
    action: "created",
    summary: `${findingClassificationLabels[draft.classification].label} ${number} erfasst`,
  });
  for (const key of draft.aiKeys ?? []) {
    next = emitAiDecision(next, session, key, { entityType: "finding", entityId: id, auditId: audit.id, label: number }, true);
  }
  return succeed(next, [], id);
}

export type FindingPatch = Partial<
  Pick<Finding, "title" | "description" | "classification" | "requirementIds" | "processId" | "ownerId" | "dueDate">
>;

const patchLabels: Record<keyof FindingPatch, string> = {
  title: "Titel",
  description: "Beschreibung",
  classification: "Klassifizierung",
  requirementIds: "Anforderungen",
  processId: "Prozess",
  ownerId: "Verantwortliche:r",
  dueDate: "Frist",
};

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function updateFinding(data: SeedData, session: Session, id: ID, patch: FindingPatch): CommandOutput {
  const finding = data.findings.find((f) => f.id === id);
  if (!finding) return fail(data, ["Feststellung nicht gefunden."]);
  const audit = data.audits.find((a) => a.id === finding.auditId);
  const keys = (Object.keys(patch) as (keyof FindingPatch)[]).filter((k) => !sameValue(patch[k], finding[k]));
  if (keys.length === 0) return succeed(data);

  const blockers: string[] = [];
  if (finding.status === "closed") blockers.push("Geschlossene Feststellungen sind nicht änderbar.");
  const contentKeys: (keyof FindingPatch)[] = ["title", "description", "classification", "requirementIds"];
  if (audit && isAuditContentLocked(audit) && keys.some((k) => contentKeys.includes(k))) {
    blockers.push("Nach Freigabe des Berichts ist der Inhalt nur über eine neue Berichtsversion änderbar.");
  }
  const merged = { ...finding, ...patch };
  if (merged.requirementIds.length === 0) blockers.push("Mindestens eine Normanforderung zuordnen.");
  if (!merged.processId) blockers.push("Prozess zuordnen.");
  if (audit && keys.includes("requirementIds")) blockers.push(...requirementsOutsideScope(merged.requirementIds, audit, data));
  if (finding.status !== "draft" && requiresCapa(merged.classification) && (!merged.ownerId || !merged.dueDate)) {
    blockers.push("Abweichungen brauchen eine verantwortliche Person und eine Frist.");
  }
  if (blockers.length > 0) return fail(data, blockers);

  const next = emit({ ...data, findings: replaceById(data.findings, id, patch) }, session, {
    entityType: "finding",
    entityId: id,
    auditId: finding.auditId,
    action: "updated",
    summary: `Feststellung ${finding.number} geändert: ${keys.map((k) => patchLabels[k]).join(", ")}`,
    changes: keys.map((k) => ({
      field: k,
      before: (finding[k] ?? null) as never,
      after: (patch[k] ?? null) as never,
    })),
  });
  return succeed(next);
}

export function transitionFinding(
  data: SeedData,
  session: Session,
  id: ID,
  to: FindingStatus,
  reason?: string,
): CommandOutput {
  const finding = data.findings.find((f) => f.id === id);
  if (!finding) return fail(data, ["Feststellung nicht gefunden."]);
  const guard = checkFindingTransition(finding, to, data);
  const blockers = [...guard.blockers];
  if (guard.ok && requiresReason("finding", finding.status, to)) blockers.push(...reasonMissing(reason));
  if (blockers.length > 0) return fail(data, blockers, guard.warnings);

  const patch: Partial<Finding> = { status: to };
  if (to === "accepted") Object.assign(patch, { acceptedById: session.personId, acceptedAt: demoNow() });
  if (to === "rejected") patch.rejectionReason = reason?.trim();
  if (to === "closed") Object.assign(patch, { closedById: session.personId, closedAt: demoNow() });

  const next = emit({ ...data, findings: replaceById(data.findings, id, patch) }, session, {
    entityType: "finding",
    entityId: id,
    auditId: finding.auditId,
    action: "status_changed",
    summary: `${finding.number} von "${findingStatusLabels[finding.status].label}" auf "${findingStatusLabels[to].label}" gesetzt`,
    changes: [{ field: "status", before: finding.status, after: to }],
    reason: reason?.trim() || undefined,
  });
  return succeed(next, guard.warnings);
}

export interface RootCauseDraft {
  method: RootCauseMethod;
  steps: string[];
  rootCause: string;
}

export function setRootCause(
  data: SeedData,
  session: Session,
  findingId: ID,
  rca: RootCauseDraft,
  aiKey?: string,
): CommandOutput {
  const finding = data.findings.find((f) => f.id === findingId);
  if (!finding) return fail(data, ["Feststellung nicht gefunden."]);
  const blockers: string[] = [];
  if (finding.status !== "accepted" && finding.status !== "in_treatment") {
    blockers.push("Die Ursachenanalyse folgt auf die Annahme der Feststellung.");
  }
  if (!rca.rootCause.trim()) blockers.push("Ursache angeben.");
  if (blockers.length > 0) return fail(data, blockers);

  const analysis = {
    method: rca.method,
    steps: rca.steps.map((s) => s.trim()).filter(Boolean),
    rootCause: rca.rootCause.trim(),
    analysedById: session.personId,
    analysedAt: demoNow(),
    aiAssisted: Boolean(aiKey),
  };
  let next = emit({ ...data, findings: replaceById(data.findings, findingId, { rootCauseAnalysis: analysis }) }, session, {
    entityType: "finding",
    entityId: findingId,
    auditId: finding.auditId,
    action: "updated",
    summary: `Ursachenanalyse zu ${finding.number} dokumentiert`,
    changes: [{ field: "rootCause", before: finding.rootCauseAnalysis?.rootCause ?? null, after: analysis.rootCause }],
  });
  if (aiKey) {
    next = emitAiDecision(next, session, aiKey, { entityType: "finding", entityId: findingId, auditId: finding.auditId, label: finding.number }, true);
  }
  return succeed(next);
}

export function linkFinding(
  data: SeedData,
  session: Session,
  findingId: ID,
  links: { riskIds?: ID[]; kpiIds?: ID[] },
  aiKey?: string,
): CommandOutput {
  const finding = data.findings.find((f) => f.id === findingId);
  if (!finding) return fail(data, ["Feststellung nicht gefunden."]);
  if (finding.status === "closed") return fail(data, ["Geschlossene Feststellungen sind nicht änderbar."]);
  const riskIds = [...new Set([...finding.links.riskIds, ...(links.riskIds ?? [])])];
  const kpiIds = [...new Set([...finding.links.kpiIds, ...(links.kpiIds ?? [])])];
  if (riskIds.length === finding.links.riskIds.length && kpiIds.length === finding.links.kpiIds.length) {
    return fail(data, ["Diese Verknüpfungen bestehen bereits."]);
  }
  const code = (list: { id: ID; code: string }[], ids: ID[]) => ids.map((i) => list.find((x) => x.id === i)?.code ?? i);
  let next = emit({ ...data, findings: replaceById(data.findings, findingId, { links: { riskIds, kpiIds } }) }, session, {
    entityType: "finding",
    entityId: findingId,
    auditId: finding.auditId,
    action: "linked",
    summary: `${finding.number} mit ${[...code(data.risks, riskIds), ...code(data.kpis, kpiIds)].join(", ")} verknüpft`,
    changes: [
      { field: "riskIds", before: finding.links.riskIds, after: riskIds },
      { field: "kpiIds", before: finding.links.kpiIds, after: kpiIds },
    ],
  });
  if (aiKey) {
    next = emitAiDecision(next, session, aiKey, { entityType: "finding", entityId: findingId, auditId: finding.auditId, label: finding.number }, true);
  }
  return succeed(next);
}
