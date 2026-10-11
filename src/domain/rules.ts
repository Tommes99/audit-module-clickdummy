import type {
  ActionStatus,
  Audit,
  AuditPlanSlot,
  AuditReport,
  AuditStatus,
  ChecklistItem,
  CorrectiveAction,
  EffectivenessCheck,
  Finding,
  FindingClassification,
  FindingStatus,
  ID,
  ISODate,
  QuestionCatalog,
  ReportStatus,
  Requirement,
  SeedData,
} from "@/types/domain";
import { actionTransitions, auditTransitions, DEMO_TODAY, findingTransitions, reportTransitions } from "@/domain/workflows";
import { actionStatusLabels, auditStatusLabels, findingStatusLabels, formatDate, reportStatusLabels } from "@/domain/labels";

/** Meldung für einen nicht vorgesehenen Übergang, mit deutschen Statusbezeichnungen */
const notPlanned = (labels: Record<string, { label: string }>, from: string, to: string) =>
  `Übergang von "${labels[from]?.label ?? from}" nach "${labels[to]?.label ?? to}" ist nicht vorgesehen.`;

export type DomainContext = Pick<
  SeedData,
  | "processes"
  | "persons"
  | "standards"
  | "requirements"
  | "checklists"
  | "findings"
  | "actions"
  | "effectivenessChecks"
  | "reports"
>;

export interface GuardResult {
  ok: boolean;
  /** Verhindern den Übergang */
  blockers: string[];
  /** Erlauben den Übergang, werden aber angezeigt */
  warnings: string[];
}

const result = (blockers: string[], warnings: string[] = []): GuardResult => ({
  ok: blockers.length === 0,
  blockers,
  warnings,
});

const personName = (ctx: DomainContext, id: ID) =>
  ctx.persons.find((p) => p.id === id)?.name ?? id;

/* ------------------------------------------------------------------ */
/* Klassifizierung                                                     */
/* ------------------------------------------------------------------ */

/** Nur Abweichungen durchlaufen den vollständigen CAPA-Zyklus (Kap. 10.2) */
export function requiresCapa(classification: FindingClassification): boolean {
  return classification === "major_nc" || classification === "minor_nc";
}

/** Externe Audits arbeiten mit der Checkliste der Zertifizierungsstelle */
export function isThirdPartyAudit(audit: Pick<Audit, "type">): boolean {
  return ["certification", "surveillance", "recertification"].includes(audit.type);
}

/** Nach Freigabe sind Checkliste, Bewertungen und neue Feststellungen gesperrt */
export function isAuditContentLocked(audit: Audit): boolean {
  return ["released", "closed", "cancelled"].includes(audit.status);
}

/** Frist einer Feststellung ist erledigt: Maßnahmen umgesetzt (Wirksamkeitsprüfung), geschlossen oder zurückgewiesen */
export const isFindingDueSettled = (finding: Finding): boolean =>
  ["effectiveness_check", "closed", "rejected"].includes(finding.status);

/** Checklistenpunkte bewerten: nur in Durchführung, nie nach Sperre des Audits */
export function checkRatingAllowed(audit: Audit): string[] {
  if (isAuditContentLocked(audit)) return ["Das Audit ist gesperrt, Bewertungen sind nicht mehr änderbar."];
  if (audit.status !== "in_progress") return [`Bewertungen sind erst ab Status "${auditStatusLabels.in_progress.label}" möglich.`];
  return [];
}

export function isReportImmutable(report: AuditReport): boolean {
  return report.status === "released" || report.status === "superseded";
}

/* ------------------------------------------------------------------ */
/* Unparteilichkeit und Qualifikation                                  */
/* ------------------------------------------------------------------ */

export interface ImpartialityConflict {
  warningKey: string;
  auditorId: ID;
  processId?: ID;
  message: string;
  overridden: boolean;
}

/**
 * Auditor:innen sollen ihre eigene Arbeit nicht auditieren (ISO 9001 Kap. 9.2.2 c,
 * sinngemäß gleich in ISO 14001/45001/50001).
 */
export function findImpartialityConflicts(audit: Audit, ctx: DomainContext): ImpartialityConflict[] {
  const overridden = new Set(audit.warningOverrides.map((o) => o.warningKey));
  const conflicts: ImpartialityConflict[] = [];

  for (const auditorId of audit.auditorIds) {
    for (const processId of audit.processIds) {
      const process = ctx.processes.find((p) => p.id === processId);
      if (process?.ownerId === auditorId) {
        const warningKey = `impartiality:${auditorId}:${processId}`;
        conflicts.push({
          warningKey,
          auditorId,
          processId,
          message: `${personName(ctx, auditorId)} verantwortet den Prozess "${process.name}" und würde die eigene Arbeit auditieren.`,
          overridden: overridden.has(warningKey),
        });
      }
    }
    if (audit.auditeeIds.includes(auditorId)) {
      const warningKey = `impartiality:${auditorId}:auditee`;
      conflicts.push({
        warningKey,
        auditorId,
        message: `${personName(ctx, auditorId)} ist im selben Audit als Auditee eingeplant.`,
        overridden: overridden.has(warningKey),
      });
    }
  }
  return conflicts;
}

export interface QualificationGap {
  auditorId: ID;
  missingStandardIds: ID[];
  message: string;
}

export function findQualificationGaps(audit: Audit, ctx: DomainContext): QualificationGap[] {
  return audit.auditorIds.flatMap((auditorId) => {
    const person = ctx.persons.find((p) => p.id === auditorId);
    if (!person) return [];
    const missing = audit.standardIds.filter((s) => !person.auditorQualifications.includes(s));
    if (missing.length === 0) return [];
    const codes = missing.map((s) => ctx.standards.find((st) => st.id === s)?.code ?? s).join(", ");
    return [{ auditorId, missingStandardIds: missing, message: `${person.name} ist nicht qualifiziert für ${codes}.` }];
  });
}

/** Jede Norm im Scope braucht mindestens eine qualifizierte Person im Team */
export function findUncoveredStandards(audit: Audit, ctx: DomainContext): ID[] {
  return audit.standardIds.filter(
    (s) =>
      !audit.auditorIds.some((a) =>
        ctx.persons.find((p) => p.id === a)?.auditorQualifications.includes(s),
      ),
  );
}

/* ------------------------------------------------------------------ */
/* Audit planen                                                        */
/* ------------------------------------------------------------------ */

/**
 * Neues Audit im Auditprogramm: Ziele, Umfang und Kriterien (Normen) festlegen, risikobasiert begründen
 * (ISO 19011 Kap. 5.4 und 5.5.2). Team-Konflikte und Qualifikationslücken sind hier nur Warnungen,
 * blockiert wird erst der Start der Durchführung.
 */
export function checkNewAudit(audit: Audit, ctx: DomainContext & { programmeYear: number }): GuardResult {
  const blockers: string[] = [];
  if (!audit.title.trim()) blockers.push("Titel angeben.");
  if (audit.type === "supplier") {
    if (!audit.supplierName?.trim()) blockers.push("Lieferanten benennen.");
  } else if (!audit.siteId) {
    blockers.push("Standort wählen.");
  }
  if (audit.standardIds.length === 0) blockers.push("Mindestens eine Norm wählen.");
  if (audit.processIds.length === 0) blockers.push("Mindestens einen Prozess wählen.");
  if (audit.siteId) {
    const foreign = audit.processIds
      .map((id) => ctx.processes.find((p) => p.id === id))
      .filter((p) => p && !p.siteIds.includes(audit.siteId as ID));
    if (foreign.length > 0) blockers.push(`Prozesse gehören nicht zum Standort: ${foreign.map((p) => p?.name).join(", ")}.`);
  }
  if (!audit.plannedStart || !audit.plannedEnd) {
    blockers.push("Zeitraum festlegen.");
  } else {
    if (audit.plannedEnd < audit.plannedStart) blockers.push("Das Ende liegt vor dem Beginn.");
    if (audit.plannedStart < DEMO_TODAY) blockers.push(`Neue Audits beginnen frühestens am ${formatDate(DEMO_TODAY)}.`);
    if (Number(audit.plannedStart.slice(0, 4)) !== ctx.programmeYear) {
      blockers.push(`Das Audit liegt außerhalb des Auditprogramms ${ctx.programmeYear}.`);
    }
  }
  const lead = ctx.persons.find((p) => p.id === audit.leadAuditorId);
  if (!lead) blockers.push("Auditleitung festlegen.");
  else if (!lead.roles.includes("auditor")) blockers.push(`${lead.name} ist nicht als Auditor:in hinterlegt.`);
  if (!audit.objectives.trim()) blockers.push("Ziele beschreiben.");
  if (!audit.scopeDescription.trim()) blockers.push("Umfang beschreiben.");
  if (audit.planningRationale.reasons.length === 0) blockers.push("Risikoeinstufung begründen.");

  const warnings =
    blockers.length > 0 || !lead
      ? []
      : [
          ...findImpartialityConflicts(audit, ctx).map((c) => c.message),
          ...findQualificationGaps(audit, ctx).map((g) => g.message),
          ...findUncoveredStandards(audit, ctx).map(
            (s) => `Für ${ctx.standards.find((st) => st.id === s)?.code ?? s} ist im Auditteam noch niemand qualifiziert.`,
          ),
        ];
  return result(blockers, warnings);
}

/* ------------------------------------------------------------------ */
/* Statusübergänge                                                     */
/* ------------------------------------------------------------------ */

export function checkAuditTransition(audit: Audit, to: AuditStatus, ctx: DomainContext): GuardResult {
  if (!auditTransitions[audit.status].includes(to)) {
    return result([notPlanned(auditStatusLabels, audit.status, to)]);
  }
  const blockers: string[] = [];
  const warnings: string[] = [];
  const checklist = ctx.checklists.find((c) => c.id === audit.checklistId);
  const auditFindings = ctx.findings.filter((f) => f.auditId === audit.id);

  if (to === "in_progress" && audit.status === "in_preparation") {
    if (!isThirdPartyAudit(audit) && !checklist) {
      blockers.push("Es ist noch keine Checkliste erzeugt.");
    }
    for (const c of findImpartialityConflicts(audit, ctx).filter((c) => !c.overridden)) {
      blockers.push(`${c.message} Auditteam anpassen oder Warnung mit Begründung übersteuern.`);
    }
    for (const s of findUncoveredStandards(audit, ctx)) {
      const code = ctx.standards.find((st) => st.id === s)?.code ?? s;
      blockers.push(`Für ${code} ist niemand im Auditteam qualifiziert.`);
    }
    warnings.push(...findQualificationGaps(audit, ctx).map((g) => g.message));
  }

  if (to === "reporting") {
    if (checklist) {
      const open = checklist.items.filter((i) => i.rating === null).length;
      if (open > 0) blockers.push(`${open} von ${checklist.items.length} Fragen sind noch nicht bewertet.`);
    }
    const drafts = auditFindings.filter((f) => f.status === "draft");
    if (drafts.length > 0) {
      blockers.push(`Feststellungen noch im Entwurf: ${drafts.map((f) => f.number).join(", ")}.`);
    }
  }

  const currentReport = ctx.reports.find((r) => r.id === audit.currentReportId);

  if (to === "in_progress" && audit.status === "reporting" && currentReport && currentReport.status !== "draft") {
    blockers.push("Der Bericht ist bereits in Prüfung oder freigegeben. Zurück in Durchführung ist nicht mehr möglich.");
  }

  if (to === "released") {
    if (!currentReport || currentReport.status !== "released") {
      blockers.push("Der Auditbericht ist noch nicht freigegeben.");
    }
  }

  if (to === "closed") {
    if (!currentReport || currentReport.status !== "released") {
      blockers.push("Die aktuelle Berichtsversion ist noch nicht freigegeben.");
    }
    const openNc = auditFindings.filter((f) => requiresCapa(f.classification) && f.status !== "closed");
    if (openNc.length > 0) {
      blockers.push(`Abweichungen noch offen: ${openNc.map((f) => f.number).join(", ")}.`);
    }
    const openOther = auditFindings.filter((f) => !requiresCapa(f.classification) && f.status !== "closed");
    if (openOther.length > 0) {
      warnings.push(`Feststellungen ohne Maßnahmenpflicht noch offen: ${openOther.map((f) => f.number).join(", ")}.`);
    }
  }

  return result(blockers, warnings);
}

export function checkFindingTransition(
  finding: Finding,
  to: FindingStatus,
  ctx: DomainContext,
): GuardResult {
  if (!findingTransitions[finding.status].includes(to)) {
    return result([notPlanned(findingStatusLabels, finding.status, to)]);
  }
  const blockers: string[] = [];
  const warnings: string[] = [];
  const capa = requiresCapa(finding.classification);
  const actions = ctx.actions.filter((a) => finding.actionIds.includes(a.id));

  if (to === "open") {
    if (finding.requirementIds.length === 0) blockers.push("Mindestens eine Normanforderung zuordnen.");
    if (!finding.processId) blockers.push("Prozess zuordnen.");
    if (!finding.description.trim()) blockers.push("Beschreibung ergänzen.");
    if (capa && !finding.ownerId) blockers.push("Verantwortliche Person festlegen.");
    if (capa && !finding.dueDate) blockers.push("Frist festlegen.");
    if (capa && finding.evidenceIds.length === 0) {
      warnings.push("Abweichung ohne Nachweis. Objektive Nachweise stärken die Feststellung.");
    }
  }

  if (to === "closed" && ["open", "accepted"].includes(finding.status) && capa) {
    blockers.push("Abweichungen werden erst nach Wirksamkeitsprüfung geschlossen.");
  }
  // Invariante 5: Auch eine zurückgewiesene Abweichung schließt nur über die Wirksamkeitsprüfung
  if (to === "closed" && finding.status === "rejected" && capa) {
    blockers.push("Eine Abweichung wird nur nach Wirksamkeitsprüfung geschlossen. Übergeben Sie sie erneut oder ändern Sie die Klassifizierung.");
  }

  if (to === "in_treatment" && finding.status === "accepted") {
    if (!finding.rootCauseAnalysis) blockers.push("Ursachenanalyse dokumentieren.");
    if (!actions.some((a) => a.kind === "corrective_action")) {
      blockers.push("Mindestens eine Korrekturmaßnahme anlegen. Eine Korrektur allein beseitigt die Ursache nicht.");
    }
  }

  if (to === "effectiveness_check") {
    const pending = actions.filter((a) => a.status !== "done" && a.status !== "cancelled");
    if (pending.length > 0) {
      blockers.push(`Maßnahmen noch nicht erledigt: ${pending.map((a) => a.number).join(", ")}.`);
    }
    if (!actions.some((a) => a.status === "done")) blockers.push("Keine erledigte Maßnahme vorhanden.");
  }

  if (to === "in_treatment" && finding.status === "effectiveness_check") {
    const check = ctx.effectivenessChecks.find((c) => c.id === finding.effectivenessCheckId);
    if (check?.result !== "not_effective") {
      blockers.push("Zurück in Bearbeitung nur mit Ergebnis \"nicht wirksam\" der Wirksamkeitsprüfung.");
    }
  }

  if (to === "closed" && finding.status === "effectiveness_check") {
    const check = ctx.effectivenessChecks.find((c) => c.id === finding.effectivenessCheckId);
    blockers.push(...checkEffectivenessForClosure(check));
  }

  return result(blockers, warnings);
}

/** Anforderungen einer Feststellung müssen zu Normen im Audit-Scope gehören (vgl. Invariante 8) */
export function requirementsOutsideScope(
  requirementIds: ID[],
  audit: Audit,
  ctx: Pick<SeedData, "requirements" | "standards">,
): string[] {
  const outside = requirementIds
    .map((id) => ctx.requirements.find((r) => r.id === id))
    .filter((r) => !r || !audit.standardIds.includes(r.standardId));
  const name = (r: Requirement | undefined) =>
    r ? `${ctx.standards.find((st) => st.id === r.standardId)?.code ?? ""} ${r.clause}`.trim() : "unbekannt";
  return outside.length > 0 ? [`Anforderungen außerhalb der Normen im Audit-Scope: ${outside.map(name).join(", ")}.`] : [];
}

/** Vier-Augen-Prinzip bei der Wirksamkeitsprüfung */
export function checkEffectivenessForClosure(check: EffectivenessCheck | undefined): string[] {
  if (!check) return ["Wirksamkeitsprüfung fehlt."];
  const blockers: string[] = [];
  if (!check.performedById || !check.performedAt) blockers.push("Wirksamkeitsprüfung ist noch nicht durchgeführt.");
  if (check.result !== "effective") blockers.push("Ergebnis der Wirksamkeitsprüfung ist nicht \"wirksam\".");
  if (!check.approvedById) blockers.push("Bestätigung durch eine zweite Person fehlt.");
  if (check.approvedById && check.approvedById === check.performedById) {
    blockers.push("Durchführung und Bestätigung müssen durch verschiedene Personen erfolgen.");
  }
  return blockers;
}

/* ------------------------------------------------------------------ */
/* Checkliste, Maßnahmen, Bericht                                      */
/* ------------------------------------------------------------------ */

export function checkCreateChecklist(audit: Audit, catalog: QuestionCatalog | undefined): GuardResult {
  const blockers: string[] = [];
  if (!catalog) return result(["Fragenkatalog nicht gefunden."]);
  if (audit.checklistId) blockers.push("Für dieses Audit existiert bereits eine Checkliste.");
  if (isAuditContentLocked(audit)) blockers.push("Das Audit ist gesperrt.");
  if (catalog.status !== "released") blockers.push("Nur freigegebene Fragenkataloge können verwendet werden.");
  const missing = audit.standardIds.filter((s) => !catalog.standardIds.includes(s));
  const warnings =
    missing.length > 0 ? ["Der Katalog deckt nicht alle Normen im Scope des Audits ab."] : [];
  return result(blockers, warnings);
}

export function checkActionTransition(action: CorrectiveAction, to: ActionStatus, source?: Finding): GuardResult {
  if (!actionTransitions[action.status].includes(to)) {
    return result([notPlanned(actionStatusLabels, action.status, to)]);
  }
  return result(actionChangeLockedBy(source));
}

/** Während der Wirksamkeitsprüfung und nach dem Schließen bleiben die Maßnahmen einer Feststellung unverändert */
export function actionChangeLockedBy(source?: Finding): string[] {
  if (source?.status === "effectiveness_check") {
    return ["Die Feststellung ist in der Wirksamkeitsprüfung. Setzen Sie sie zuerst mit Begründung zurück in Bearbeitung."];
  }
  if (source?.status === "closed") return ["Die Feststellung ist geschlossen."];
  return [];
}

export function checkReportTransition(report: AuditReport, to: ReportStatus): GuardResult {
  if (to === "superseded") {
    return result(["Ein freigegebener Bericht wird nur durch Anlegen einer neuen Version ersetzt."]);
  }
  if (!reportTransitions[report.status].includes(to)) {
    return result([notPlanned(reportStatusLabels, report.status, to)]);
  }
  const blockers: string[] = [];
  if (to === "in_review" || to === "released") {
    if (!report.summary.trim()) blockers.push("Zusammenfassung ergänzen.");
    if (!report.conclusion.trim()) blockers.push("Gesamtbewertung ergänzen.");
  }
  return result(blockers);
}

/** Freigegebene Berichte sind unveränderlich, Änderung nur über neue Version mit Begründung */
export function checkReportVersion(report: AuditReport, reason: string): GuardResult {
  const blockers: string[] = [];
  if (report.status !== "released") blockers.push("Eine neue Version ist nur von einem freigegebenen Bericht möglich.");
  if (!reason.trim()) blockers.push("Begründung für die neue Version angeben.");
  return result(blockers);
}

export function checkEffectivenessRecord(
  finding: Finding,
  check: EffectivenessCheck | undefined,
  resultValue: "effective" | "not_effective",
  comment: string,
): GuardResult {
  const blockers: string[] = [];
  if (!check) return result(["Wirksamkeitsprüfung ist nicht geplant."]);
  if (finding.status !== "effectiveness_check") blockers.push("Die Feststellung befindet sich nicht in der Wirksamkeitsprüfung.");
  if (resultValue === "not_effective" && !comment.trim()) blockers.push("Begründung für \"nicht wirksam\" angeben.");
  return result(blockers);
}

/** Vier-Augen-Prinzip: Bestätigung durch eine andere Person als die Durchführende */
export function checkEffectivenessApproval(check: EffectivenessCheck | undefined, approverId: ID, finding?: Finding): GuardResult {
  if (!check) return result(["Wirksamkeitsprüfung fehlt."]);
  const blockers: string[] = [];
  if (finding && finding.status !== "effectiveness_check") blockers.push("Die Feststellung befindet sich nicht in der Wirksamkeitsprüfung.");
  if (!check.performedById || !check.performedAt) blockers.push("Wirksamkeitsprüfung ist noch nicht durchgeführt.");
  if (check.result === "not_effective") blockers.push("Ergebnis ist \"nicht wirksam\", eine Bestätigung ist nicht vorgesehen.");
  if (check.approvedById) blockers.push("Die Prüfung wurde bereits bestätigt.");
  if (check.performedById && check.performedById === approverId) {
    blockers.push("Die Bestätigung muss durch eine andere Person als die Durchführende erfolgen.");
  }
  return result(blockers);
}

/**
 * Schlägt den Prozess für eine Feststellung vor: Plan-Slot mit der größten Überschneidung
 * der Anforderungen des Checklistenpunkts. Übernommene Punkte erben den Prozess der Vorfeststellung.
 */
export function suggestProcessForItem(
  item: ChecklistItem,
  audit: Audit,
  planSlots: AuditPlanSlot[],
  findings: Finding[] = [],
): ID | undefined {
  if (item.carriedOverFindingId) {
    const origin = findings.find((f) => f.id === item.carriedOverFindingId);
    if (origin) return origin.processId;
  }
  let best: { processId: ID; score: number } | undefined;
  for (const slot of planSlots
    .filter((s) => s.auditId === audit.id && s.processId)
    .sort((a, b) => a.start.localeCompare(b.start))) {
    const score = slot.requirementIds.filter((r) => item.requirementIds.includes(r)).length;
    if (score > 0 && (!best || score > best.score)) best = { processId: slot.processId!, score };
  }
  if (best) return best.processId;
  return audit.processIds.length === 1 ? audit.processIds[0] : undefined;
}

/* ------------------------------------------------------------------ */
/* Normübergreifendes Mapping                                          */
/* ------------------------------------------------------------------ */

/**
 * Inhaltlich gleichwertige Anforderungen anderer Normen.
 * 1. gemeinsamer HS-Schlüssel (z. B. internes Audit)
 * 2. kuratiertes Mapping (z. B. Bewertung der Einhaltung in 14001 und 45001)
 */
export function equivalentRequirements(requirementId: ID, requirements: Requirement[]): Requirement[] {
  const source = requirements.find((r) => r.id === requirementId);
  if (!source) return [];
  return requirements.filter((r) => {
    if (r.id === source.id) return false;
    if (source.harmonizedKey && r.harmonizedKey === source.harmonizedKey) return true;
    if (source.relatedRequirementIds?.includes(r.id)) return true;
    if (r.relatedRequirementIds?.includes(source.id)) return true;
    return false;
  });
}

/* ------------------------------------------------------------------ */
/* Abdeckungsmatrix                                                    */
/* ------------------------------------------------------------------ */

export interface CoverageCell {
  requirementId: ID;
  siteId: ID;
  lastAuditedOn?: ISODate;
  lastAuditId?: ID;
  nextPlannedOn?: ISODate;
  nextPlannedAuditId?: ID;
}

/**
 * Zeigt je Anforderung und Standort, wann zuletzt auditiert wurde und was geplant ist.
 * Ziel: alle Kapitel je Standort im dreijährigen Zertifizierungszyklus abdecken.
 */
export function computeCoverage(
  audits: Audit[],
  requirementIds: ID[],
  siteIds: ID[],
): CoverageCell[] {
  const done: AuditStatus[] = ["released", "closed"];
  const upcoming: AuditStatus[] = ["planned", "in_preparation", "in_progress", "reporting"];

  return siteIds.flatMap((siteId) =>
    requirementIds.map((requirementId) => {
      const relevant = audits.filter((a) => a.siteId === siteId && a.requirementIds.includes(requirementId));
      const last = relevant
        .filter((a) => done.includes(a.status))
        .sort((a, b) => (b.actualEnd ?? b.plannedEnd).localeCompare(a.actualEnd ?? a.plannedEnd))[0];
      const next = relevant
        .filter((a) => upcoming.includes(a.status))
        .sort((a, b) => a.plannedStart.localeCompare(b.plannedStart))[0];
      return {
        requirementId,
        siteId,
        lastAuditedOn: last ? last.actualEnd ?? last.plannedEnd : undefined,
        lastAuditId: last?.id,
        nextPlannedOn: next?.plannedStart,
        nextPlannedAuditId: next?.id,
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Fälligkeiten                                                        */
/* ------------------------------------------------------------------ */

export type DueState = "overdue" | "due_soon" | "on_track" | "none";

export function dueState(dueDate: ISODate | undefined, today: ISODate, soonDays = 14): DueState {
  if (!dueDate) return "none";
  const diff = (Date.parse(dueDate) - Date.parse(today)) / 86_400_000;
  if (diff < 0) return "overdue";
  if (diff <= soonDays) return "due_soon";
  return "on_track";
}

/** "in 5 Tagen fällig", "seit 3 Tagen überfällig" */
export function relativeDueText(dueDate: ISODate, today: ISODate): string {
  const diff = Math.round((Date.parse(dueDate) - Date.parse(today)) / 86_400_000);
  if (diff === 0) return "heute fällig";
  if (diff === 1) return "morgen fällig";
  if (diff > 1) return `in ${diff} Tagen fällig`;
  if (diff === -1) return "seit 1 Tag überfällig";
  return `seit ${Math.abs(diff)} Tagen überfällig`;
}

/* ------------------------------------------------------------------ */
/* Fragenkataloge: Entwurf, Änderung, Freigabe                         */
/* ------------------------------------------------------------------ */

/** Nächste freie Versionsnummer innerhalb eines Katalogs (gleicher key) */
export const nextCatalogVersion = (catalogs: QuestionCatalog[], key: string): number =>
  Math.max(0, ...catalogs.filter((c) => c.key === key).map((c) => c.version)) + 1;

/** Neue Version nur aus der freigegebenen Version, und nur ein Entwurf je Katalog */
export function checkCreateCatalogDraft(base: QuestionCatalog | undefined, catalogs: QuestionCatalog[]): GuardResult {
  if (!base) return result(["Fragenkatalog nicht gefunden."]);
  const blockers: string[] = [];
  if (base.status !== "released") blockers.push("Neue Versionen entstehen aus der freigegebenen Version.");
  const draft = catalogs.find((c) => c.key === base.key && c.status === "draft");
  if (draft) blockers.push(`Für diesen Katalog gibt es bereits einen Entwurf (Version ${draft.version}).`);
  return result(blockers);
}

/** Pflichtangaben einer Katalogfrage: Text und mindestens eine Anforderung aus den Normen des Katalogs */
export function checkCatalogQuestion(
  question: { text: string; requirementIds: ID[] },
  catalog: QuestionCatalog,
  requirements: Requirement[],
): string[] {
  const blockers: string[] = [];
  if (!question.text.trim()) blockers.push("Fragetext angeben.");
  if (question.requirementIds.length === 0) blockers.push("Mindestens eine Anforderung zuordnen.");
  const outside = question.requirementIds.filter(
    (id) => !catalog.standardIds.includes(requirements.find((r) => r.id === id)?.standardId ?? ""),
  );
  if (outside.length > 0) blockers.push("Anforderungen müssen zu den Normen des Katalogs gehören.");
  return blockers;
}

const questionSignature = (q: QuestionCatalog["questions"][number]) =>
  JSON.stringify([q.text.trim(), q.guidance?.trim() ?? "", q.evidenceHint?.trim() ?? "", [...q.requirementIds].sort()]);

/** Hat sich der Inhalt gegenüber der Vorgängerversion geändert (Reihenfolge zählt)? */
export const catalogChanged = (base: QuestionCatalog | undefined, draft: QuestionCatalog): boolean =>
  !base || JSON.stringify(base.questions.map(questionSignature)) !== JSON.stringify(draft.questions.map(questionSignature));

/** Freigabe: Entwurf, Fragen vollständig, tatsächliche Änderung, Begründung (Pflicht) */
export function checkReleaseCatalog(
  draft: QuestionCatalog | undefined,
  base: QuestionCatalog | undefined,
  requirements: Requirement[],
  reason: string | undefined,
): GuardResult {
  if (!draft) return result(["Fragenkatalog nicht gefunden."]);
  const blockers: string[] = [];
  if (draft.status !== "draft") blockers.push("Nur Entwürfe können freigegeben werden.");
  if (draft.questions.length === 0) blockers.push("Der Katalog braucht mindestens eine Frage.");
  draft.questions.forEach((q, i) => {
    checkCatalogQuestion(q, draft, requirements).forEach((b) => blockers.push(`Frage ${i + 1}: ${b}`));
  });
  if (draft.questions.length > 0 && !catalogChanged(base, draft)) {
    blockers.push(`Keine Änderung gegenüber Version ${base?.version}. Ändern Sie mindestens eine Frage.`);
  }
  if (reason !== undefined && !reason.trim()) blockers.push("Änderungsgrund angeben.");
  return result(blockers);
}
