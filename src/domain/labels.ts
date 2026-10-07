import type {
  ActionKind,
  ActionStatus,
  AuditStatus,
  AuditType,
  CatalogStatus,
  ChecklistRating,
  EffectivenessResult,
  EntityType,
  EventAction,
  EvidenceKind,
  FindingClassification,
  FindingStatus,
  ProcessCategory,
  ReportStatus,
  RiskLevel,
  RoleKey,
  RootCauseMethod,
} from "@/types/domain";

/**
 * Einzige Quelle für UI-Bezeichnungen. Komponenten verwenden nie hartkodierte
 * Statustexte, damit Begriffe über alle Screens identisch bleiben.
 */

export type Tone = "neutral" | "info" | "progress" | "warning" | "danger" | "success" | "muted";

export interface LabelDef {
  label: string;
  tone: Tone;
}

export const roleLabels: Record<RoleKey, string> = {
  programme_manager: "Auditprogramm-Verantwortliche:r",
  auditor: "Auditor:in",
  auditee: "Auditee",
  action_owner: "Maßnahmenverantwortliche:r",
  management: "Geschäftsführung",
};

export const auditTypeLabels: Record<AuditType, string> = {
  internal: "Internes Audit",
  supplier: "Lieferantenaudit",
  certification: "Zertifizierungsaudit",
  surveillance: "Überwachungsaudit",
  recertification: "Rezertifizierungsaudit",
};

export const auditStatusLabels: Record<AuditStatus, LabelDef> = {
  planned: { label: "Geplant", tone: "neutral" },
  in_preparation: { label: "In Vorbereitung", tone: "info" },
  in_progress: { label: "In Durchführung", tone: "progress" },
  reporting: { label: "Berichtserstellung", tone: "warning" },
  released: { label: "Bericht freigegeben", tone: "success" },
  closed: { label: "Abgeschlossen", tone: "muted" },
  cancelled: { label: "Abgesagt", tone: "muted" },
};

export const checklistRatingLabels: Record<ChecklistRating, LabelDef> = {
  conform: { label: "Konform", tone: "success" },
  deviation: { label: "Abweichung", tone: "danger" },
  not_applicable: { label: "Nicht anwendbar", tone: "muted" },
};

export const findingClassificationLabels: Record<FindingClassification, LabelDef & { short: string }> = {
  major_nc: { label: "Hauptabweichung", short: "HA", tone: "danger" },
  minor_nc: { label: "Nebenabweichung", short: "NA", tone: "warning" },
  observation: { label: "Beobachtung", short: "B", tone: "info" },
  opportunity: { label: "Verbesserungspotenzial", short: "VP", tone: "info" },
  positive: { label: "Positive Feststellung", short: "PF", tone: "success" },
};

export const findingStatusLabels: Record<FindingStatus, LabelDef> = {
  draft: { label: "Entwurf", tone: "muted" },
  open: { label: "Offen", tone: "warning" },
  accepted: { label: "Angenommen", tone: "info" },
  rejected: { label: "Zurückgewiesen", tone: "danger" },
  in_treatment: { label: "In Bearbeitung", tone: "progress" },
  effectiveness_check: { label: "Wirksamkeitsprüfung", tone: "info" },
  closed: { label: "Geschlossen", tone: "success" },
};

export const actionKindLabels: Record<ActionKind, string> = {
  correction: "Korrektur (Sofortmaßnahme)",
  corrective_action: "Korrekturmaßnahme",
  improvement: "Verbesserungsmaßnahme",
};

export const actionStatusLabels: Record<ActionStatus, LabelDef> = {
  open: { label: "Offen", tone: "warning" },
  in_progress: { label: "In Umsetzung", tone: "progress" },
  done: { label: "Erledigt", tone: "success" },
  cancelled: { label: "Verworfen", tone: "muted" },
};

export const effectivenessResultLabels: Record<EffectivenessResult, LabelDef> = {
  effective: { label: "Wirksam", tone: "success" },
  not_effective: { label: "Nicht wirksam", tone: "danger" },
};

export const reportStatusLabels: Record<ReportStatus, LabelDef> = {
  draft: { label: "Entwurf", tone: "muted" },
  in_review: { label: "In Prüfung", tone: "warning" },
  released: { label: "Freigegeben", tone: "success" },
  superseded: { label: "Ersetzt", tone: "muted" },
};

export const evidenceKindLabels: Record<EvidenceKind, string> = {
  file: "Datei",
  photo: "Foto",
  document_link: "Dokument (verlinkt)",
  interview_note: "Interviewnotiz",
};

export const riskLevelLabels: Record<RiskLevel, LabelDef> = {
  low: { label: "Niedrig", tone: "success" },
  medium: { label: "Mittel", tone: "warning" },
  high: { label: "Hoch", tone: "danger" },
};

export const processCategoryLabels: Record<ProcessCategory, string> = {
  management: "Managementprozess",
  core: "Kernprozess",
  support: "Unterstützungsprozess",
};

export const eventActionLabels: Record<EventAction, string> = {
  created: "Angelegt",
  updated: "Geändert",
  status_changed: "Status geändert",
  assigned: "Zugewiesen",
  unassigned: "Zuweisung entfernt",
  rated: "Bewertet",
  evidence_attached: "Nachweis angehängt",
  linked: "Verknüpft",
  released: "Freigegeben",
  version_created: "Neue Version",
  warning_overridden: "Warnung übersteuert",
  ai_suggestion_accepted: "KI-Vorschlag übernommen",
  ai_suggestion_rejected: "KI-Vorschlag verworfen",
};

export const entityTypeLabels: Record<EntityType, string> = {
  programme: "Auditprogramm",
  audit: "Audit",
  plan_slot: "Auditplan",
  checklist: "Checkliste",
  checklist_item: "Checklistenpunkt",
  evidence: "Nachweis",
  finding: "Feststellung",
  action: "Maßnahme",
  effectiveness_check: "Wirksamkeitsprüfung",
  report: "Bericht",
  catalog: "Fragenkatalog",
};

export const rootCauseMethodLabels: Record<RootCauseMethod, string> = {
  five_why: "5-Why",
  ishikawa: "Ishikawa",
  free_text: "Freitext",
};

/** Status eines Unparteilichkeitskonflikts im Auditteam */
export const conflictStatusLabels: Record<"open" | "overridden", LabelDef> = {
  open: { label: "Offen", tone: "danger" },
  overridden: { label: "Übersteuert", tone: "warning" },
};

export const catalogStatusLabels: Record<CatalogStatus, LabelDef> = {
  draft: { label: "Entwurf", tone: "muted" },
  released: { label: "Freigegeben", tone: "success" },
  retired: { label: "Außer Kraft", tone: "muted" },
};

/**
 * Datumsformat einheitlich de-DE. Feste Zeitzone, damit Server und Client
 * (Hydrierung) sowie Demo-Rechner dieselbe Darstellung erzeugen.
 */
export const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "Europe/Berlin" });
export const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string): string => dateTimeFormat.format(new Date(iso));

/** Kurzform für Events und Chips: Korrektur und Korrekturmaßnahme nie vermischen */
export const actionKindShortLabels: Record<ActionKind, string> = {
  correction: "Korrektur",
  corrective_action: "Korrekturmaßnahme",
  improvement: "Verbesserungsmaßnahme",
};

export const evidenceKindShortLabels: Record<EvidenceKind, string> = {
  file: "Datei",
  photo: "Foto",
  document_link: "Dokumentlink",
  interview_note: "Interviewnotiz",
};

/** Was die Startseite je Rolle zeigt (Rollenwechsler) */
export const roleStartHints: Record<RoleKey, string> = {
  programme_manager: "Programmstatus, Audits mit Blockern, fällige Wirksamkeitsprüfungen",
  auditor: "Eigene anstehende Audits, unbewertete Checklistenpunkte",
  auditee: "Feststellungen zur Annahme, angeforderte Nachweise",
  action_owner: "Eigene Maßnahmen nach Fälligkeit",
  management: "Dashboard und freigegebene Berichte",
};
