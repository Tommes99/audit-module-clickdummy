/**
 * Abgeleitete Werte (Zähler, Fälligkeiten, Abdeckung, Aufgaben) werden nie gespeichert,
 * sondern hier aus dem Datenbestand berechnet. Alle Funktionen sind rein: (data, ...) => Wert.
 * In Komponenten: `const data = useAppStore((s) => s.data); const x = useMemo(() => sel(data, ...), [data])`.
 */
import type {
  Audit,
  AuditStatus,
  Checklist,
  CorrectiveAction,
  EffectivenessCheck,
  Finding,
  ID,
  ISODate,
  QuestionCatalog,
  Requirement,
  SeedData,
} from "@/types/domain";
import {
  checkAuditTransition,
  computeCoverage,
  dueState,
  findImpartialityConflicts,
  findQualificationGaps,
  findUncoveredStandards,
  requiresCapa,
  type CoverageCell,
  type DueState,
  type GuardResult,
} from "@/domain/rules";
import { auditTransitions, DEMO_TODAY } from "@/domain/workflows";
import type { Session } from "@/domain/permissions";
import { auditStatusLabels, formatDate, type Tone } from "@/domain/labels";
import { itemNumbers } from "@/store/commands/checklist";

/* ------------------------------------------------------------------ */
/* Verknüpfte Objekte als Chips                                        */
/* ------------------------------------------------------------------ */

export type EntityKind =
  | "requirement"
  | "risk"
  | "kpi"
  | "process"
  | "site"
  | "person"
  | "audit"
  | "finding"
  | "action"
  | "standard"
  | "catalog";

export interface ResolvedEntity {
  /** Fachliche Nummer oder Kapitel, z. B. "R-012", "ISO 45001 8.1.3", "F-2026-007" */
  label: string;
  /** Kurztitel, z. B. "Kollision Flurförderzeug" */
  title?: string;
  /** Ziel der Navigation, wenn es eine Seite gibt */
  href?: string;
}

/** Zielseite einer Anforderung: Mapping-Tab des neuesten freigegebenen Katalogs, der sie abfragt, mit vorbefüllter Suche */
export function requirementMappingHref(data: SeedData, requirementId: ID): string | undefined {
  const catalog = data.catalogs
    .filter((c) => c.status === "released" && c.questions.some((q) => q.requirementIds.includes(requirementId)))
    .sort((a, b) => b.version - a.version)[0];
  if (!catalog) return undefined;
  const label = resolveEntity(data, "requirement", requirementId).label;
  return `/kataloge/${catalog.id}?tab=mapping&q=${encodeURIComponent(label)}`;
}

/** Löst eine technische ID in fachliche Nummer und Kurztitel auf. In der UI erscheinen nie IDs. */
export function resolveEntity(data: SeedData, kind: EntityKind, id: ID): ResolvedEntity {
  switch (kind) {
    case "requirement": {
      const r = data.requirements.find((x) => x.id === id);
      const std = data.standards.find((s) => s.id === r?.standardId);
      return r ? { label: `${std?.code ?? ""} ${r.clause}`.trim(), title: r.title } : { label: id };
    }
    case "risk": {
      const r = data.risks.find((x) => x.id === id);
      return r ? { label: r.code, title: r.title } : { label: id };
    }
    case "kpi": {
      const k = data.kpis.find((x) => x.id === id);
      return k ? { label: k.code, title: k.name } : { label: id };
    }
    case "process": {
      const p = data.processes.find((x) => x.id === id);
      return { label: p?.name ?? id };
    }
    case "site": {
      const s = data.sites.find((x) => x.id === id);
      return { label: s?.name ?? id };
    }
    case "person": {
      const p = data.persons.find((x) => x.id === id);
      return { label: p?.name ?? id, title: p?.jobTitle };
    }
    case "audit": {
      const a = data.audits.find((x) => x.id === id);
      return a ? { label: a.number, title: a.title, href: `/audits/${a.id}` } : { label: id };
    }
    case "finding": {
      const f = data.findings.find((x) => x.id === id);
      return f ? { label: f.number, title: f.title, href: `/feststellungen/${f.id}` } : { label: id };
    }
    case "action": {
      const a = data.actions.find((x) => x.id === id);
      return a ? { label: a.number, title: a.title, href: `/feststellungen/${a.source.id}#massnahmen` } : { label: id };
    }
    case "standard": {
      const s = data.standards.find((x) => x.id === id);
      return { label: s?.code ?? id, title: s?.title };
    }
    case "catalog": {
      const c = data.catalogs.find((x) => x.id === id);
      return c ? { label: `Version ${c.version}`, title: c.name, href: `/kataloge/${c.id}` } : { label: id };
    }
  }
}

export const personName = (data: SeedData, id: ID | undefined): string =>
  data.persons.find((p) => p.id === id)?.name ?? "Nicht zugewiesen";

/* ------------------------------------------------------------------ */
/* Audit: Guards, Fortschritt                                          */
/* ------------------------------------------------------------------ */

export interface AuditTransitionOption {
  to: AuditStatus;
  guard: GuardResult;
}

export interface AuditOverview {
  conflicts: ReturnType<typeof findImpartialityConflicts>;
  gaps: ReturnType<typeof findQualificationGaps>;
  uncoveredStandardIds: ID[];
  /** Nur erlaubte Übergänge (Buttons nur dafür zeigen), jeweils mit Guard-Ergebnis */
  transitions: AuditTransitionOption[];
}

export function auditOverview(data: SeedData, audit: Audit): AuditOverview {
  return {
    conflicts: findImpartialityConflicts(audit, data),
    gaps: findQualificationGaps(audit, data),
    uncoveredStandardIds: findUncoveredStandards(audit, data),
    transitions: auditTransitions[audit.status].map((to) => ({ to, guard: checkAuditTransition(audit, to, data) })),
  };
}

export const auditChecklist = (data: SeedData, audit: Audit): Checklist | undefined =>
  data.checklists.find((c) => c.id === audit.checklistId);

export interface ChecklistProgress {
  total: number;
  rated: number;
  open: number;
  deviations: number;
}

export function checklistProgress(checklist: Checklist | undefined): ChecklistProgress {
  const items = checklist?.items ?? [];
  const rated = items.filter((i) => i.rating !== null).length;
  return {
    total: items.length,
    rated,
    open: items.length - rated,
    deviations: items.filter((i) => i.rating === "deviation").length,
  };
}

export { itemNumbers };

export const auditFindings = (data: SeedData, auditId: ID): Finding[] =>
  data.findings.filter((f) => f.auditId === auditId).sort((a, b) => a.number.localeCompare(b.number));

/** Berichtsversionen eines Audits, neueste zuerst, ersetzte bleiben sichtbar */
export const auditReports = (data: SeedData, auditId: ID) =>
  data.reports.filter((r) => r.auditId === auditId).sort((a, b) => b.version - a.version);

/** Nachweise zu einer ID-Liste, unbekannte IDs werden ausgelassen */
export const publishedEvidenceFor = (data: SeedData, ids: ID[]) =>
  ids.map((id) => data.evidence.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => Boolean(e));

/* ------------------------------------------------------------------ */
/* Nachweiskette                                                       */
/* ------------------------------------------------------------------ */

export interface ChainNode {
  key: "requirement" | "item" | "evidence" | "finding" | "actions" | "effectiveness";
  label: string;
  detail: string;
  /** erledigte Glieder gefüllt, offene als Umriss */
  done: boolean;
  /** Glied trifft für diese Feststellung nicht zu (z. B. kein Checklistenpunkt bei Übernahme aus externem Bericht) */
  na?: boolean;
  href?: string;
}

/** Anforderung → Checklistenpunkt → Nachweis → Feststellung → Maßnahmen → Wirksamkeitsprüfung */
export function evidenceChain(data: SeedData, finding: Finding): ChainNode[] {
  const reqs = finding.requirementIds.map((id) => resolveEntity(data, "requirement", id).label);
  let itemLabel = "Kein Checklistenpunkt";
  let itemHref: string | undefined;
  if (finding.checklistItemId) {
    for (const c of data.checklists) {
      if (c.items.some((i) => i.id === finding.checklistItemId)) {
        itemLabel = `Punkt ${itemNumbers(c).get(finding.checklistItemId) ?? ""}`.trim();
        itemHref = `/audits/${c.auditId}?tab=checkliste#${finding.checklistItemId}`;
      }
    }
  }
  const actions = data.actions.filter((a) => finding.actionIds.includes(a.id));
  const done = actions.filter((a) => a.status === "done").length;
  const check = data.effectivenessChecks.find((c) => c.id === finding.effectivenessCheckId);
  const capa = requiresCapa(finding.classification);

  return [
    { key: "requirement", label: "Anforderung", detail: reqs.join(", "), done: reqs.length > 0 },
    {
      key: "item",
      label: "Checklistenpunkt",
      detail: finding.checklistItemId ? itemLabel : "Nicht zutreffend",
      done: Boolean(finding.checklistItemId),
      na: !finding.checklistItemId,
      href: itemHref,
    },
    {
      key: "evidence",
      label: "Nachweis",
      detail: finding.evidenceIds.length === 0 ? "Kein Nachweis" : `${finding.evidenceIds.length} ${finding.evidenceIds.length === 1 ? "Nachweis" : "Nachweise"}`,
      done: finding.evidenceIds.length > 0,
      href: "#nachweise",
    },
    { key: "finding", label: "Feststellung", detail: finding.number, done: finding.status !== "draft" && finding.status !== "rejected" },
    {
      key: "actions",
      label: "Maßnahmen",
      detail: actions.length === 0 ? "Keine Maßnahme" : `${done} von ${actions.length} erledigt`,
      done: actions.length > 0 && actions.every((a) => a.status === "done" || a.status === "cancelled") && done > 0,
      href: "#massnahmen",
    },
    {
      key: "effectiveness",
      label: "Wirksamkeitsprüfung",
      detail: !capa
        ? "Nicht erforderlich"
        : check?.approvedById
          ? "Bestätigt"
          : check?.performedAt
            ? "Bestätigung offen"
            : check
              ? "Geplant"
              : "Nicht geplant",
      done: !capa ? finding.status === "closed" : Boolean(check?.approvedById && check.result === "effective"),
      href: "#wirksamkeit",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Meine Aufgaben                                                      */
/* ------------------------------------------------------------------ */

export interface TaskItem {
  key: string;
  title: string;
  subtitle?: string;
  href: string;
  badge?: { label: string; tone: Tone };
  /** Frist für relative Anzeige */
  dueDate?: ISODate;
  /** Blocker und Warnungen zum Eintrag, getrennt dargestellt */
  blockers?: string[];
  warnings?: string[];
}

export interface TaskSection {
  key: string;
  title: string;
  /** Text, wenn die Liste leer ist: sagt, was zu tun ist */
  empty: string;
  items: TaskItem[];
}

const upcomingStatuses: AuditStatus[] = ["planned", "in_preparation", "in_progress", "reporting"];

const actionTask = (data: SeedData, a: CorrectiveAction): TaskItem => {
  const f = data.findings.find((x) => x.id === a.source.id);
  return {
    key: a.id,
    title: `${a.number} ${a.title}`,
    subtitle: f ? `zu ${f.number}` : undefined,
    href: `/feststellungen/${a.source.id}#massnahmen`,
    dueDate: a.dueDate,
  };
};

export function effectivenessDue(data: SeedData, today: ISODate = DEMO_TODAY): { finding: Finding; check?: EffectivenessCheck; state: DueState }[] {
  return data.findings
    .filter((f) => f.status === "effectiveness_check")
    .map((finding) => {
      const check = data.effectivenessChecks.find((c) => c.id === finding.effectivenessCheckId);
      return { finding, check, state: dueState(check?.plannedDate, today, 30) };
    })
    .sort((a, b) => (a.check?.plannedDate ?? "9").localeCompare(b.check?.plannedDate ?? "9"));
}

export function tasksFor(data: SeedData, session: Session, today: ISODate = DEMO_TODAY): TaskSection[] {
  const { personId, role } = session;
  const mine = (a: CorrectiveAction) => a.ownerId === personId && (a.status === "open" || a.status === "in_progress");
  const myActions: TaskSection = {
    key: "actions",
    title: "Meine Maßnahmen nach Fälligkeit",
    empty: "Keine offenen Maßnahmen. Neue Maßnahmen erscheinen hier, sobald sie Ihnen zugewiesen werden.",
    items: data.actions.filter(mine).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((a) => actionTask(data, a)),
  };

  if (role === "programme_manager") {
    const blocked: TaskItem[] = data.audits
      // Nur der Start der Durchführung: ein noch nicht freigegebener Bericht ist normaler Fortschritt, kein Blocker
      .filter((a) => a.status === "in_preparation")
      .flatMap((audit) => {
        const guard = checkAuditTransition(audit, "in_progress", data);
        if (guard.ok && guard.warnings.length === 0) return [];
        return [{
          key: audit.id,
          title: `${audit.number} ${audit.title}`,
          subtitle: `Geplant ab ${formatDate(audit.plannedStart)}`,
          href: `/audits/${audit.id}`,
          badge: guard.ok ? { label: "Hinweise", tone: "warning" as Tone } : { label: "Blockiert", tone: "danger" as Tone },
          blockers: guard.blockers,
          warnings: guard.warnings,
        }];
      });
    return [
      {
        key: "blocked",
        title: "Audits mit Blockern",
        empty: "Keine blockierten Audits.",
        items: blocked,
      },
      {
        key: "effectiveness",
        title: "Fällige Wirksamkeitsprüfungen",
        empty: "Keine Wirksamkeitsprüfung offen.",
        items: effectivenessDue(data, today).map(({ finding, check }) => ({
          key: finding.id,
          title: `${finding.number} ${finding.title}`,
          subtitle: check?.performedAt ? "Durchgeführt, Bestätigung offen" : "Prüfung durchführen",
          href: `/feststellungen/${finding.id}#wirksamkeit`,
          dueDate: check?.plannedDate,
        })),
      },
    ];
  }

  if (role === "auditor") {
    const audits = data.audits.filter((a) => a.auditorIds.includes(personId) && upcomingStatuses.includes(a.status));
    const unrated: TaskItem[] = audits
      .filter((a) => a.status === "in_progress")
      .flatMap((a) => {
        const open = checklistProgress(auditChecklist(data, a)).open;
        return open > 0
          ? [{ key: a.id, title: `${a.number} ${a.title}`, subtitle: `${open} Checklistenpunkte unbewertet`, href: `/audits/${a.id}?tab=checkliste` }]
          : [];
      });
    return [
      {
        key: "audits",
        title: "Meine anstehenden Audits",
        empty: "Sie sind keinem anstehenden Audit zugewiesen. Die Auditprogramm-Verantwortlichen weisen Auditor:innen zu.",
        items: audits
          .sort((a, b) => a.plannedStart.localeCompare(b.plannedStart))
          .map((a) => ({
            key: a.id,
            title: `${a.number} ${a.title}`,
            // Ein Audittermin ist keine Frist: Zeitraum als Text, Status als Badge
            subtitle: `${formatDate(a.plannedStart)} bis ${formatDate(a.plannedEnd)}`,
            href: `/audits/${a.id}`,
            badge: auditStatusLabels[a.status],
          })),
      },
      { key: "unrated", title: "Unbewertete Checklistenpunkte", empty: "Alle Punkte bewertet oder noch kein Audit in Durchführung.", items: unrated },
    ];
  }

  if (role === "auditee") {
    const ownsProcess = (f: Finding) => data.processes.find((p) => p.id === f.processId)?.ownerId === personId;
    const toAccept = data.findings.filter((f) => f.status === "open" && (f.ownerId === personId || ownsProcess(f)));
    return [
      {
        key: "accept",
        title: "Feststellungen zur Annahme",
        empty: "Keine Feststellung wartet auf Ihre Annahme.",
        items: toAccept.map((f) => ({
          key: f.id,
          title: `${f.number} ${f.title}`,
          href: `/feststellungen/${f.id}`,
          dueDate: f.dueDate,
          badge: { label: "Annehmen oder zurückweisen", tone: "warning" as Tone },
        })),
      },
      { key: "evidence", title: "Angeforderte Nachweise", empty: "Keine Nachweise angefordert.", items: requestedEvidence(data, personId) },
      myActions,
    ];
  }

  if (role === "action_owner") return [myActions];

  // Geschäftsführung: freigegebene Berichte, Kennzahlen siehe Dashboard
  return [
    {
      key: "reports",
      title: "Freigegebene Berichte",
      empty: "Noch keine freigegebenen Berichte.",
      items: data.reports
        .filter((r) => r.status === "released")
        .sort((a, b) => (b.releasedAt ?? "").localeCompare(a.releasedAt ?? ""))
        .map((r) => {
          const audit = data.audits.find((a) => a.id === r.auditId);
          return {
            key: r.id,
            title: `${audit?.number ?? ""} ${audit?.title ?? ""}`.trim(),
            subtitle: `Version ${r.version}`,
            href: `/audits/${r.auditId}?tab=bericht`,
          };
        }),
    },
  ];
}

/**
 * Angeforderte Nachweise: unbewertete Checklistenpunkte ohne Nachweis in anstehenden Audits,
 * deren Auditplan-Slots (Anforderungen) die Person als Teilnehmende:n führt.
 */
export function requestedEvidence(data: SeedData, personId: ID): TaskItem[] {
  const items: TaskItem[] = [];
  for (const audit of data.audits.filter((a) => upcomingStatuses.includes(a.status) && a.auditeeIds.includes(personId))) {
    const checklist = auditChecklist(data, audit);
    if (!checklist) continue;
    const reqs = new Set(
      data.planSlots.filter((s) => s.auditId === audit.id && s.participantIds.includes(personId)).flatMap((s) => s.requirementIds),
    );
    const numbers = itemNumbers(checklist);
    for (const item of checklist.items) {
      if (item.rating !== null || item.evidenceIds.length > 0 || !item.evidenceHint) continue;
      if (!item.requirementIds.some((r) => reqs.has(r))) continue;
      items.push({
        key: item.id,
        title: `${audit.number} Punkt ${numbers.get(item.id)}: ${item.text}`,
        subtitle: `Erbeten: ${item.evidenceHint}`,
        href: `/audits/${audit.id}?tab=checkliste#${item.id}`,
      });
    }
  }
  return items;
}

/* ------------------------------------------------------------------ */
/* Programm: Abdeckungsmatrix, Jahresplan                              */
/* ------------------------------------------------------------------ */

export interface CoverageRow {
  requirement: Requirement;
  standardCode: string;
  cells: { siteId: ID; certified: boolean; cell: CoverageCell }[];
}

export function coverageMatrix(data: SeedData): CoverageRow[] {
  const siteIds = data.sites.map((s) => s.id);
  const cells = computeCoverage(data.audits, data.requirements.map((r) => r.id), siteIds);
  return data.requirements.map((requirement) => {
    const std = data.standards.find((s) => s.id === requirement.standardId);
    return {
      requirement,
      standardCode: std?.code ?? "",
      cells: siteIds.map((siteId) => ({
        siteId,
        certified: data.sites.find((s) => s.id === siteId)?.certifiedStandardIds.includes(requirement.standardId) ?? false,
        cell: cells.find((c) => c.siteId === siteId && c.requirementId === requirement.id)!,
      })),
    };
  });
}

/** Audits des Jahresplans nach Plan-Start sortiert */
export const programmeAudits = (data: SeedData, programmeId?: ID): Audit[] =>
  data.audits
    .filter((a) => !programmeId || a.programmeId === programmeId)
    .sort((a, b) => a.plannedStart.localeCompare(b.plannedStart));

/* ------------------------------------------------------------------ */
/* Maßnahmen und Dashboard                                             */
/* ------------------------------------------------------------------ */

export interface ActionRow {
  action: CorrectiveAction;
  finding?: Finding;
  siteId: ID | null;
  state: DueState;
}

export function actionRows(data: SeedData, today: ISODate = DEMO_TODAY): ActionRow[] {
  return data.actions.map((action) => {
    const finding = data.findings.find((f) => f.id === action.source.id);
    const open = action.status === "open" || action.status === "in_progress";
    return {
      action,
      finding,
      siteId: finding?.siteId ?? null,
      state: open ? dueState(action.dueDate, today) : "none",
    };
  });
}

export interface DashboardStats {
  /** Offene Abweichungen je Norm und Standort (eine Feststellung zählt je betroffener Norm) */
  openNcMatrix: { standardId: ID; code: string; counts: { siteId: ID | null; count: number }[]; total: number }[];
  openNcTotal: number;
  actions: { overdue: number; dueSoon: number; open: number };
  effectiveness: { overdue: number; dueSoon: number; open: number };
  programme: { total: number; done: number; inProgress: number; planned: number; cancelled: number };
}

export function dashboardStats(data: SeedData, today: ISODate = DEMO_TODAY): DashboardStats {
  const openNc = data.findings.filter((f) => requiresCapa(f.classification) && f.status !== "closed" && f.status !== "draft");
  const siteIds: (ID | null)[] = [...data.sites.map((s) => s.id), null];
  const stdOf = (f: Finding) => [...new Set(f.requirementIds.map((r) => data.requirements.find((x) => x.id === r)?.standardId).filter(Boolean) as ID[])];

  const openNcMatrix = data.standards.map((std) => {
    const counts = siteIds.map((siteId) => ({
      siteId,
      count: openNc.filter((f) => f.siteId === siteId && stdOf(f).includes(std.id)).length,
    }));
    return { standardId: std.id, code: std.code, counts, total: counts.reduce((n, c) => n + c.count, 0) };
  });

  const rows = actionRows(data, today).filter((r) => r.action.status === "open" || r.action.status === "in_progress");
  const checks = effectivenessDue(data, today);
  const audits = data.audits.filter((a) => a.status !== "cancelled");
  return {
    openNcMatrix,
    openNcTotal: openNc.length,
    actions: {
      overdue: rows.filter((r) => r.state === "overdue").length,
      dueSoon: rows.filter((r) => r.state === "due_soon").length,
      open: rows.length,
    },
    effectiveness: {
      overdue: checks.filter((c) => c.state === "overdue").length,
      dueSoon: checks.filter((c) => c.state === "due_soon").length,
      open: checks.length,
    },
    programme: {
      total: audits.length,
      done: audits.filter((a) => a.status === "released" || a.status === "closed").length,
      inProgress: audits.filter((a) => a.status === "in_progress" || a.status === "reporting").length,
      planned: audits.filter((a) => a.status === "planned" || a.status === "in_preparation").length,
      cancelled: data.audits.length - audits.length,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Kataloge                                                            */
/* ------------------------------------------------------------------ */

/** Versionen eines Katalogs (gleicher key), neueste zuerst */
export const catalogVersions = (data: SeedData, catalog: QuestionCatalog): QuestionCatalog[] =>
  data.catalogs.filter((c) => c.key === catalog.key).sort((a, b) => b.version - a.version);

export interface CatalogDiff {
  added: QuestionCatalog["questions"];
  removed: QuestionCatalog["questions"];
  unchanged: QuestionCatalog["questions"];
}

/** Vergleich zweier Versionen über den Fragetext (IDs sind je Version verschieden) */
export function compareCatalogs(older: QuestionCatalog, newer: QuestionCatalog): CatalogDiff {
  const oldTexts = new Set(older.questions.map((q) => q.text));
  const newTexts = new Set(newer.questions.map((q) => q.text));
  return {
    added: newer.questions.filter((q) => !oldTexts.has(q.text)),
    removed: older.questions.filter((q) => !newTexts.has(q.text)),
    unchanged: newer.questions.filter((q) => oldTexts.has(q.text)),
  };
}

/** Audits, deren Checkliste auf einer Katalogversion beruht (Snapshot-Nachweis) */
export const auditsUsingCatalog = (data: SeedData, catalogId: ID): Audit[] =>
  data.checklists
    .filter((c) => c.catalogId === catalogId)
    .map((c) => data.audits.find((a) => a.id === c.auditId))
    .filter((a): a is Audit => Boolean(a));
