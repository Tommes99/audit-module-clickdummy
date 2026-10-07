import type { AuditReport, ID, SeedData } from "@/types/domain";
import {
  checkReportTransition,
  checkReportVersion,
  isReportImmutable,
} from "@/domain/rules";
import { demoNow, requiresReason } from "@/domain/workflows";
import { reportContentHash } from "@/domain/factories";
import type { Session } from "@/domain/permissions";
import { emit, fail, reasonMissing, replaceById, succeed, type CommandOutput } from "@/store/helpers";
import { emitAiDecision, findSuggestion } from "@/store/commands/ai";

/** Berichte werden in der Berichtserstellung eingereicht und freigegeben, neue Versionen auch danach */
const reportPhaseBlockers = (data: SeedData, auditId: ID): string[] => {
  const audit = data.audits.find((a) => a.id === auditId);
  return audit && ["reporting", "released", "closed"].includes(audit.status)
    ? []
    : ["Das Audit ist nicht in der Berichtserstellung."];
};

/** Schlüssel des vorbereiteten KI-Berichtsentwurfs zu einem Audit */
export const reportAiKey = (auditNumber: string) => `report-${auditNumber.toLowerCase()}`;

export function createReportDraft(data: SeedData, session: Session, auditId: ID, fromAi: boolean): CommandOutput {
  const audit = data.audits.find((a) => a.id === auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);
  const blockers: string[] = [];
  if (audit.status !== "reporting") blockers.push("Berichte werden in der Berichtserstellung angelegt.");
  const current = data.reports.find((r) => r.id === audit.currentReportId);
  if (current && current.status !== "superseded") blockers.push("Es existiert bereits ein Bericht zu diesem Audit.");
  const key = reportAiKey(audit.number);
  const suggestion = fromAi ? findSuggestion(key) : undefined;
  if (fromAi && !suggestion) blockers.push("Für dieses Audit liegt kein KI-Berichtsentwurf vor.");
  if (blockers.length > 0) return fail(data, blockers);

  const out = suggestion?.output ?? {};
  const id = `rep-${audit.number.replace(/^A-/, "")}-v1`;
  const managementIds = data.persons.filter((p) => p.roles.includes("management")).map((p) => p.id);
  const report: AuditReport = {
    id,
    auditId,
    version: 1,
    status: "draft",
    summary: typeof out.summary === "string" ? out.summary : "",
    conclusion: typeof out.conclusion === "string" ? out.conclusion : "",
    strengths: Array.isArray(out.strengths) ? out.strengths : [],
    attachmentEvidenceIds: [],
    distributionIds: [...new Set([...managementIds, ...audit.auditeeIds])],
    createdById: session.personId,
    createdAt: demoNow(),
    aiAssisted: Boolean(suggestion),
  };
  let next = emit(
    { ...data, reports: [...data.reports, report], audits: replaceById(data.audits, auditId, { currentReportId: id }) },
    session,
    { entityType: "report", entityId: id, auditId, action: "created", summary: `Berichtsentwurf zu ${audit.number} angelegt` },
  );
  if (suggestion) {
    next = emitAiDecision(next, session, key, { entityType: "report", entityId: id, auditId, label: audit.number }, true);
  }
  return succeed(next, [], id);
}

export type ReportPatch = Partial<Pick<AuditReport, "summary" | "conclusion" | "strengths">>;

export function updateReportDraft(data: SeedData, session: Session, id: ID, patch: ReportPatch): CommandOutput {
  const report = data.reports.find((r) => r.id === id);
  if (!report) return fail(data, ["Bericht nicht gefunden."]);
  if (isReportImmutable(report)) return fail(data, ["Freigegebene Berichte sind unveränderlich. Legen Sie eine neue Version an."]);
  if (report.status !== "draft") return fail(data, ["Nur Entwürfe sind bearbeitbar. Setzen Sie den Bericht zuerst zurück in den Entwurf."]);

  const keys = (Object.keys(patch) as (keyof ReportPatch)[]).filter(
    (k) => JSON.stringify(patch[k]) !== JSON.stringify(report[k]),
  );
  if (keys.length === 0) return succeed(data);
  const next = emit({ ...data, reports: replaceById(data.reports, id, patch) }, session, {
    entityType: "report",
    entityId: id,
    auditId: report.auditId,
    action: "updated",
    summary: `Berichtsentwurf Version ${report.version} geändert`,
    changes: keys.map((k) => ({ field: k, before: report[k] as never, after: (patch[k] ?? null) as never })),
  });
  return succeed(next);
}

export function submitReport(data: SeedData, session: Session, id: ID): CommandOutput {
  const report = data.reports.find((r) => r.id === id);
  if (!report) return fail(data, ["Bericht nicht gefunden."]);
  const guard = checkReportTransition(report, "in_review");
  const blockers = [...guard.blockers, ...reportPhaseBlockers(data, report.auditId)];
  if (blockers.length > 0) return fail(data, blockers);
  const next = emit({ ...data, reports: replaceById(data.reports, id, { status: "in_review" }) }, session, {
    entityType: "report",
    entityId: id,
    auditId: report.auditId,
    action: "status_changed",
    summary: `Bericht Version ${report.version} zur Prüfung eingereicht`,
    changes: [{ field: "status", before: "draft", after: "in_review" }],
  });
  return succeed(next);
}

/** In Prüfung zurück in den Entwurf, mit Begründung (transitionsRequiringReason) */
export function returnReportToDraft(data: SeedData, session: Session, id: ID, reason: string): CommandOutput {
  const report = data.reports.find((r) => r.id === id);
  if (!report) return fail(data, ["Bericht nicht gefunden."]);
  const guard = checkReportTransition(report, "draft");
  const blockers = [...guard.blockers];
  if (guard.ok && requiresReason("report", report.status, "draft")) blockers.push(...reasonMissing(reason));
  if (blockers.length > 0) return fail(data, blockers);
  const next = emit({ ...data, reports: replaceById(data.reports, id, { status: "draft" }) }, session, {
    entityType: "report",
    entityId: id,
    auditId: report.auditId,
    action: "status_changed",
    summary: `Bericht Version ${report.version} zurück in den Entwurf gesetzt`,
    changes: [{ field: "status", before: "in_review", after: "draft" }],
    reason: reason.trim(),
  });
  return succeed(next);
}

/** Setzt den Inhaltshash. Danach folgt transitionAudit(..., "released") */
export function releaseReport(data: SeedData, session: Session, id: ID): CommandOutput {
  const report = data.reports.find((r) => r.id === id);
  if (!report) return fail(data, ["Bericht nicht gefunden."]);
  const guard = checkReportTransition(report, "released");
  const blockers = [...guard.blockers, ...reportPhaseBlockers(data, report.auditId)];
  if (blockers.length > 0) return fail(data, blockers);
  const audit = data.audits.find((a) => a.id === report.auditId);
  const patch = {
    status: "released" as const,
    releasedById: session.personId,
    releasedAt: demoNow(),
    contentHash: reportContentHash(report),
  };
  const next = emit({ ...data, reports: replaceById(data.reports, id, patch) }, session, {
    entityType: "report",
    entityId: id,
    auditId: report.auditId,
    action: "released",
    summary: `Auditbericht ${audit?.number ?? ""} Version ${report.version} freigegeben`.replace("  ", " "),
    changes: [{ field: "status", before: "in_review", after: "released" }],
  });
  return succeed(next);
}

/** Einziger Weg, einen freigegebenen Bericht zu ändern: neue Version, alte wird "ersetzt" */
export function createReportVersion(data: SeedData, session: Session, id: ID, reason: string): CommandOutput {
  const report = data.reports.find((r) => r.id === id);
  if (!report) return fail(data, ["Bericht nicht gefunden."]);
  const guard = checkReportVersion(report, reason);
  if (!guard.ok) return fail(data, guard.blockers);
  const audit = data.audits.find((a) => a.id === report.auditId);
  if (!audit) return fail(data, ["Audit nicht gefunden."]);

  const newReportId = `rep-${audit.number.replace(/^A-/, "")}-v${report.version + 1}`;
  const version: AuditReport = {
    ...report,
    id: newReportId,
    version: report.version + 1,
    status: "draft",
    createdById: session.personId,
    createdAt: demoNow(),
    releasedById: undefined,
    releasedAt: undefined,
    contentHash: undefined,
    supersedesReportId: report.id,
    changeReason: reason.trim(),
  };
  const next = emit(
    {
      ...data,
      reports: [...replaceById(data.reports, id, { status: "superseded" }), version],
      audits: replaceById(data.audits, audit.id, { currentReportId: newReportId }),
    },
    session,
    {
      entityType: "report",
      entityId: newReportId,
      auditId: audit.id,
      action: "version_created",
      summary: `Auditbericht ${audit.number} Version ${version.version} angelegt, Version ${report.version} ersetzt`,
      reason: reason.trim(),
      changes: [{ field: "status", before: "released", after: "superseded" }],
    },
  );
  return succeed(next, [], newReportId);
}
