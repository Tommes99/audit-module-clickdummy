import type { Audit, AuditStatus, AuditType, Finding, ID, ISODate, RiskLevel, SeedData } from "@/types/domain";
import {
  checkAuditTransition,
  checkCreateChecklist,
  checkNewAudit,
  findImpartialityConflicts,
  findQualificationGaps,
  requiresCapa,
} from "@/domain/rules";
import { auditStatusLabels, riskLevelLabels } from "@/domain/labels";
import { createChecklistSnapshot, newId, nextNumber } from "@/domain/factories";
import { DEMO_TODAY, demoNow, requiresReason } from "@/domain/workflows";
import type { Session } from "@/domain/permissions";
import { emit, fail, personName, reasonMissing, replaceById, succeed, type CommandOutput } from "@/store/helpers";

const findAudit = (data: SeedData, id: ID): Audit | undefined => data.audits.find((a) => a.id === id);

export interface AuditDraft {
  type: AuditType;
  title: string;
  /** null bei Lieferantenaudits */
  siteId: ID | null;
  supplierName?: string;
  certificationBody?: string;
  standardIds: ID[];
  processIds: ID[];
  plannedStart: ISODate;
  plannedEnd: ISODate;
  leadAuditorId: ID;
  objectives: string;
  scopeDescription: string;
  riskLevel: RiskLevel;
  /** Eine Begründung je Eintrag */
  riskReasons: string[];
}

/**
 * Plant ein neues Audit im Auditprogramm (Status Geplant). Abgeleitet werden:
 * Anforderungen im Scope (alle Kapitel der gewählten Normen, Invariante 8) und
 * Auditees (Verantwortliche der gewählten Prozesse, nicht bei Lieferantenaudits).
 */
export function createAudit(data: SeedData, session: Session, draft: AuditDraft): CommandOutput {
  const programme = data.programmes[0];
  if (!programme) return fail(data, ["Es ist kein Auditprogramm angelegt."]);
  const supplier = draft.type === "supplier";
  const processIds = [...new Set(draft.processIds)];
  const auditeeIds = supplier
    ? []
    : [...new Set(processIds.map((id) => data.processes.find((p) => p.id === id)?.ownerId).filter((id): id is ID => Boolean(id)))];

  const year = Number(draft.plannedStart.slice(0, 4)) || programme.year;
  const number = nextNumber("A", year, data.audits.map((a) => a.number));
  const audit: Audit = {
    id: newId("aud"),
    number,
    programmeId: programme.id,
    title: draft.title.trim(),
    type: draft.type,
    status: "planned",
    siteId: supplier ? null : draft.siteId,
    supplierName: supplier ? draft.supplierName?.trim() : undefined,
    certificationBody: draft.certificationBody?.trim() || undefined,
    objectives: draft.objectives.trim(),
    scopeDescription: draft.scopeDescription.trim(),
    standardIds: draft.standardIds,
    requirementIds: data.requirements.filter((r) => draft.standardIds.includes(r.standardId)).map((r) => r.id),
    processIds,
    leadAuditorId: draft.leadAuditorId,
    auditorIds: draft.leadAuditorId ? [draft.leadAuditorId] : [],
    auditeeIds,
    plannedStart: draft.plannedStart,
    plannedEnd: draft.plannedEnd,
    planningRationale: { riskLevel: draft.riskLevel, reasons: draft.riskReasons.map((r) => r.trim()).filter(Boolean) },
    warningOverrides: [],
  };

  const guard = checkNewAudit(audit, { ...data, programmeYear: programme.year });
  if (!guard.ok) return fail(data, guard.blockers);

  const next = emit({ ...data, audits: [...data.audits, audit] }, session, {
    entityType: "audit",
    entityId: audit.id,
    auditId: audit.id,
    action: "created",
    summary: `Audit ${number} geplant, Risikoeinstufung ${riskLevelLabels[draft.riskLevel].label.toLowerCase()}`,
  });
  return succeed(next, guard.warnings, audit.id);
}

export function transitionAudit(
  data: SeedData,
  session: Session,
  auditId: ID,
  to: AuditStatus,
  reason?: string,
): CommandOutput {
  const audit = findAudit(data, auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  const guard = checkAuditTransition(audit, to, data);
  const blockers = [...guard.blockers];
  if (guard.ok && requiresReason("audit", audit.status, to)) blockers.push(...reasonMissing(reason));
  if (blockers.length > 0) return fail(data, blockers, guard.warnings);

  const patch: Partial<Audit> = { status: to };
  if (to === "in_progress" && audit.status === "in_preparation") patch.actualStart = DEMO_TODAY;
  if (to === "reporting") patch.actualEnd = DEMO_TODAY;

  const next = emit({ ...data, audits: replaceById(data.audits, auditId, patch) }, session, {
    entityType: "audit",
    entityId: auditId,
    auditId,
    action: "status_changed",
    summary: `Audit ${audit.number} von "${auditStatusLabels[audit.status].label}" auf "${auditStatusLabels[to].label}" gesetzt`,
    changes: [{ field: "status", before: audit.status, after: to }],
    reason: reason?.trim() || undefined,
  });
  return succeed(next, guard.warnings);
}

/** Team darf bis zum Start der Durchführung angepasst werden */
const teamEditable = (audit: Audit) => audit.status === "planned" || audit.status === "in_preparation";

export function assignAuditor(data: SeedData, session: Session, auditId: ID, personId: ID): CommandOutput {
  const audit = findAudit(data, auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  if (!teamEditable(audit)) return fail(data, ["Das Auditteam ist nach dem Start nicht mehr änderbar."]);
  if (audit.auditorIds.includes(personId)) return fail(data, ["Die Person ist bereits im Auditteam."]);
  if (!data.persons.some((p) => p.id === personId)) return fail(data, ["Person nicht gefunden."]);

  const auditorIds = [...audit.auditorIds, personId];
  const updated = { ...audit, auditorIds };
  const warnings = [
    ...findQualificationGaps(updated, data).filter((g) => g.auditorId === personId).map((g) => g.message),
    ...findImpartialityConflicts(updated, data).filter((c) => c.auditorId === personId).map((c) => c.message),
  ];
  const next = emit({ ...data, audits: replaceById(data.audits, auditId, { auditorIds }) }, session, {
    entityType: "audit",
    entityId: auditId,
    auditId,
    action: "assigned",
    summary: `${personName(data, personId)} als Auditor:in zu ${audit.number} zugewiesen`,
    changes: [{ field: "auditorIds", before: audit.auditorIds, after: auditorIds }],
  });
  return succeed(next, warnings);
}

export function removeAuditor(data: SeedData, session: Session, auditId: ID, personId: ID): CommandOutput {
  const audit = findAudit(data, auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  if (!teamEditable(audit)) return fail(data, ["Das Auditteam ist nach dem Start nicht mehr änderbar."]);
  if (audit.leadAuditorId === personId) return fail(data, ["Die Auditleitung kann nicht entfernt werden."]);
  if (!audit.auditorIds.includes(personId)) return fail(data, ["Die Person ist nicht im Auditteam."]);

  const auditorIds = audit.auditorIds.filter((id) => id !== personId);
  const next = emit({ ...data, audits: replaceById(data.audits, auditId, { auditorIds }) }, session, {
    entityType: "audit",
    entityId: auditId,
    auditId,
    action: "unassigned",
    summary: `${personName(data, personId)} aus dem Auditteam von ${audit.number} entfernt`,
    changes: [{ field: "auditorIds", before: audit.auditorIds, after: auditorIds }],
  });
  return succeed(next);
}

export function overrideWarning(
  data: SeedData,
  session: Session,
  auditId: ID,
  warningKey: string,
  reason: string,
): CommandOutput {
  const audit = findAudit(data, auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  const conflict = findImpartialityConflicts(audit, data).find((c) => c.warningKey === warningKey);
  if (!conflict) return fail(data, ["Diese Warnung besteht nicht (mehr)."]);
  if (conflict.overridden) return fail(data, ["Die Warnung wurde bereits übersteuert."]);
  const missing = reasonMissing(reason);
  if (missing.length > 0) return fail(data, missing);

  const override = { warningKey, reason: reason.trim(), overriddenById: session.personId, overriddenAt: demoNow() };
  const next = emit(
    { ...data, audits: replaceById(data.audits, auditId, { warningOverrides: [...audit.warningOverrides, override] }) },
    session,
    {
      entityType: "audit",
      entityId: auditId,
      auditId,
      action: "warning_overridden",
      summary: `Unparteilichkeitswarnung in ${audit.number} übersteuert: ${conflict.message.replace(/\.$/, "")}`,
      reason: reason.trim(),
    },
  );
  return succeed(next);
}

/** Offene Abweichungen aus früheren Audits am selben Standort, die im Scope liegen (Übernahme) */
function carryOverCandidates(data: SeedData, audit: Audit): Finding[] {
  return data.findings.filter(
    (f) =>
      f.auditId !== audit.id &&
      f.siteId === audit.siteId &&
      requiresCapa(f.classification) &&
      !["draft", "rejected", "closed"].includes(f.status) &&
      f.requirementIds.some((r) => audit.requirementIds.includes(r)),
  );
}

export function createChecklist(data: SeedData, session: Session, auditId: ID, catalogId: ID): CommandOutput {
  const audit = findAudit(data, auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  const catalog = data.catalogs.find((c) => c.id === catalogId);
  const guard = checkCreateChecklist(audit, catalog);
  if (!guard.ok || !catalog) return fail(data, guard.blockers);

  const carryOver = carryOverCandidates(data, audit);
  const checklistId = `chk-${audit.number.replace(/^A-/, "")}`;
  const checklist = createChecklistSnapshot({
    checklistId,
    audit,
    catalog,
    carryOverFindings: carryOver,
    actorId: session.personId,
    now: demoNow(),
  });
  const carryText = carryOver.length > 0 ? `, offene Feststellung ${carryOver.map((f) => f.number).join(", ")} übernommen` : "";
  const next = emit(
    {
      ...data,
      checklists: [...data.checklists, checklist],
      audits: replaceById(data.audits, auditId, { checklistId }),
    },
    session,
    {
      entityType: "checklist",
      entityId: checklistId,
      auditId,
      action: "created",
      summary: `Checkliste aus Katalog Version ${catalog.version} erzeugt${carryText}`,
    },
  );
  return succeed(next, guard.warnings, checklistId);
}
