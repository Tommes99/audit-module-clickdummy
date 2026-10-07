/**
 * Domänenmodell Audit-Modul (Clickdummy)
 *
 * Grundsätze:
 * - Identifier und Feldnamen auf Englisch, UI-Texte auf Deutsch (siehe src/domain/labels.ts).
 * - Normen, Anforderungen und Fragenkataloge sind Daten, keine Code-Konstanten.
 * - Jede Feststellung hat einen Pflichtbezug zu Anforderung, Standort und Prozess.
 * - Jede Mutation erzeugt ein AuditEvent (siehe src/lib/audit-trail.ts).
 */

export type ID = string;
/** ISO 8601 mit Offset, z. B. "2026-10-13T08:00:00+02:00" */
export type ISODateTime = string;
/** ISO 8601 Datum, z. B. "2026-10-31" */
export type ISODate = string;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/* ------------------------------------------------------------------ */
/* Organisation und Stammdaten                                         */
/* ------------------------------------------------------------------ */

export type RoleKey =
  | "programme_manager" // Auditprogramm-Verantwortliche:r (QM/EHS)
  | "auditor" // interne:r oder externe:r Auditor:in
  | "auditee" // Prozessverantwortliche:r, auditierte Person
  | "action_owner" // Maßnahmenverantwortliche:r
  | "management"; // Geschäftsführung, liest Dashboard und Berichte

export interface Organisation {
  id: ID;
  name: string;
  industry: string;
}

export interface Site {
  id: ID;
  organisationId: ID;
  name: string;
  city: string;
  /** Normen, nach denen der Standort zertifiziert ist */
  certifiedStandardIds: ID[];
}

export type ProcessCategory = "management" | "core" | "support";

export interface Process {
  id: ID;
  name: string;
  category: ProcessCategory;
  siteIds: ID[];
  /** Prozessverantwortliche:r, relevant für die Unparteilichkeitsprüfung */
  ownerId: ID;
}

export interface Person {
  id: ID;
  name: string;
  jobTitle: string;
  email: string;
  /** null = standortübergreifend oder extern */
  siteId: ID | null;
  roles: RoleKey[];
  /** Normen, für die die Person als Auditor:in qualifiziert ist */
  auditorQualifications: ID[];
  isExternal: boolean;
  externalOrganisation?: string;
}

/* ------------------------------------------------------------------ */
/* Normen, Anforderungen, Fragenkataloge                               */
/* ------------------------------------------------------------------ */

export interface Standard {
  id: ID;
  /** z. B. "ISO 14001" */
  code: string;
  /** z. B. "2015" */
  edition: string;
  title: string;
  /** Kurzlabel für Chips, z. B. "UM" */
  shortLabel: string;
}

/**
 * Semantische Schlüssel der Harmonized Structure (HS, früher Annex SL).
 * Bewusst KEINE Kapitelnummern: Gleiche Nummer bedeutet nicht gleicher Inhalt
 * (ISO 14001 6.1.2 = Umweltaspekte, ISO 45001 6.1.2 = Gefährdungsermittlung),
 * und gleicher Inhalt hat nicht immer gleiche Nummer
 * (Nichtkonformität: ISO 9001/14001/45001 Kap. 10.2, ISO 50001:2018 Kap. 10.1).
 */
export type HarmonizedKey =
  | "context"
  | "policy"
  | "risks_opportunities"
  | "competence"
  | "documented_information"
  | "operational_planning_control"
  | "monitoring_measurement"
  | "internal_audit"
  | "management_review"
  | "nonconformity_corrective_action"
  | "continual_improvement";

export interface Requirement {
  id: ID;
  standardId: ID;
  /** Kapitelnummer laut Norm, z. B. "9.1.2" */
  clause: string;
  /** Sinngemäßer Kurztitel. Keine Wiedergabe von Normtext (Urheberrecht ISO/DIN). */
  title: string;
  /** Gesetzt, wenn das Kapitel auf gemeinsamem HS-Text beruht */
  harmonizedKey?: HarmonizedKey;
  /** Kuratiertes Mapping für normspezifische, aber inhaltlich verwandte Kapitel */
  relatedRequirementIds?: ID[];
}

export type CatalogStatus = "draft" | "released" | "retired";

export interface CatalogQuestion {
  id: ID;
  text: string;
  guidance?: string;
  /** Welche Nachweise typischerweise geprüft werden */
  evidenceHint?: string;
  requirementIds: ID[];
}

export interface QuestionCatalog {
  id: ID;
  /** Stabiler Schlüssel über Versionen hinweg */
  key: string;
  name: string;
  version: number;
  status: CatalogStatus;
  standardIds: ID[];
  releasedAt?: ISODateTime;
  releasedById?: ID;
  supersedesCatalogId?: ID;
  changeNote?: string;
  questions: CatalogQuestion[];
}

/* ------------------------------------------------------------------ */
/* Auditprogramm und Audits                                            */
/* ------------------------------------------------------------------ */

export type ProgrammeStatus = "draft" | "approved" | "archived";

export interface AuditProgramme {
  id: ID;
  organisationId: ID;
  year: number;
  title: string;
  objectives: string[];
  ownerId: ID;
  status: ProgrammeStatus;
  approvedById?: ID;
  approvedAt?: ISODateTime;
}

export type AuditType =
  | "internal" // First Party
  | "supplier" // Second Party
  | "certification" // Third Party, Erstzertifizierung
  | "surveillance" // Third Party, Überwachungsaudit
  | "recertification"; // Third Party, Rezertifizierung

export type AuditStatus =
  | "planned"
  | "in_preparation"
  | "in_progress"
  | "reporting"
  | "released"
  | "closed"
  | "cancelled";

export type RiskLevel = "low" | "medium" | "high";

/** Begründung der risikobasierten Programmplanung (ISO 9001 Kap. 9.2.2 a) */
export interface PlanningRationale {
  riskLevel: RiskLevel;
  reasons: string[];
}

/** Bewusst übersteuerte Warnung, z. B. Unparteilichkeitskonflikt */
export interface WarningOverride {
  warningKey: string;
  reason: string;
  overriddenById: ID;
  overriddenAt: ISODateTime;
}

export interface Audit {
  id: ID;
  /** Fachliche Nummer, z. B. "A-2026-09" */
  number: string;
  programmeId: ID;
  title: string;
  type: AuditType;
  status: AuditStatus;
  /** null bei Lieferantenaudits (Ort beim Lieferanten) */
  siteId: ID | null;
  supplierName?: string;
  certificationBody?: string;
  objectives: string;
  scopeDescription: string;
  standardIds: ID[];
  requirementIds: ID[];
  processIds: ID[];
  leadAuditorId: ID;
  /** Inklusive leadAuditorId */
  auditorIds: ID[];
  auditeeIds: ID[];
  plannedStart: ISODate;
  plannedEnd: ISODate;
  actualStart?: ISODate;
  actualEnd?: ISODate;
  /** Externe Audits haben oft keine eigene Checkliste */
  checklistId?: ID;
  currentReportId?: ID;
  planningRationale: PlanningRationale;
  warningOverrides: WarningOverride[];
}

export interface AuditPlanSlot {
  id: ID;
  auditId: ID;
  start: ISODateTime;
  end: ISODateTime;
  topic: string;
  location?: string;
  processId?: ID;
  requirementIds: ID[];
  participantIds: ID[];
}

/* ------------------------------------------------------------------ */
/* Durchführung                                                        */
/* ------------------------------------------------------------------ */

export type ChecklistRating = "conform" | "deviation" | "not_applicable";

export type ChecklistItemOrigin =
  | "catalog" // aus dem Katalog-Snapshot
  | "carry_over" // offene Feststellung aus Vorjahr oder Vor-Audit
  | "ad_hoc"; // während des Audits ergänzt

export interface ChecklistItem {
  id: ID;
  origin: ChecklistItemOrigin;
  /** Referenz auf die Katalogfrage, null bei carry_over und ad_hoc */
  sourceQuestionId: ID | null;
  carriedOverFindingId?: ID;
  /** Kopie zum Snapshot-Zeitpunkt, bleibt bei Katalogänderung stabil */
  text: string;
  guidance?: string;
  evidenceHint?: string;
  requirementIds: ID[];
  rating: ChecklistRating | null;
  notes: string;
  evidenceIds: ID[];
  findingIds: ID[];
  ratedById?: ID;
  ratedAt?: ISODateTime;
}

/** Eingefrorener Snapshot einer Katalogversion für genau ein Audit */
export interface Checklist {
  id: ID;
  auditId: ID;
  catalogId: ID;
  catalogVersion: number;
  snapshotAt: ISODateTime;
  snapshotById: ID;
  items: ChecklistItem[];
}

export type EvidenceKind = "file" | "photo" | "document_link" | "interview_note";

export interface Evidence {
  id: ID;
  auditId: ID;
  kind: EvidenceKind;
  title: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  /** Bei document_link: Verweis in die Dokumentenlenkung */
  url?: string;
  /** Integritätsnachweis. Im Dummy simuliert, produktiv serverseitig SHA-256. */
  sha256?: string;
  capturedAt: ISODateTime;
  uploadedById: ID;
  uploadedAt: ISODateTime;
  /** DSGVO: Interviewnotizen, Fotos mit Personen */
  containsPersonalData: boolean;
  retentionUntil?: ISODate;
}

/* ------------------------------------------------------------------ */
/* Feststellungen und Maßnahmen (CAPA)                                 */
/* ------------------------------------------------------------------ */

export type FindingClassification =
  | "major_nc" // Hauptabweichung
  | "minor_nc" // Nebenabweichung
  | "observation" // Beobachtung / Hinweis
  | "opportunity" // Verbesserungspotenzial
  | "positive"; // positive Feststellung

export type FindingStatus =
  | "draft" // während des Audits erfasst, noch unvollständig
  | "open" // an Auditee kommuniziert
  | "accepted" // von Auditee angenommen
  | "rejected" // von Auditee begründet zurückgewiesen
  | "in_treatment" // Ursachenanalyse und Maßnahmen laufen
  | "effectiveness_check" // alle Maßnahmen erledigt, Wirksamkeit wird geprüft
  | "closed";

export type RootCauseMethod = "five_why" | "ishikawa" | "free_text";

export interface RootCauseAnalysis {
  method: RootCauseMethod;
  steps: string[];
  rootCause: string;
  analysedById: ID;
  analysedAt: ISODateTime;
  /** Vorschlag wurde mit KI-Unterstützung erzeugt und von einem Menschen bestätigt */
  aiAssisted?: boolean;
}

/** Verknüpfungen in Nachbarmodule (GRC, ESG/EHS-Daten) */
export interface FindingLinks {
  riskIds: ID[];
  kpiIds: ID[];
}

export interface Finding {
  id: ID;
  /** Fachliche Nummer, z. B. "F-2026-004" */
  number: string;
  auditId: ID;
  classification: FindingClassification;
  status: FindingStatus;
  title: string;
  description: string;
  /** Pflichtbezug, mindestens eine Anforderung */
  requirementIds: ID[];
  siteId: ID | null;
  processId: ID;
  checklistItemId?: ID;
  evidenceIds: ID[];
  raisedById: ID;
  raisedAt: ISODateTime;
  ownerId?: ID;
  dueDate?: ISODate;
  acceptedById?: ID;
  acceptedAt?: ISODateTime;
  rejectionReason?: string;
  rootCauseAnalysis?: RootCauseAnalysis;
  actionIds: ID[];
  effectivenessCheckId?: ID;
  links: FindingLinks;
  carriedOverFromFindingId?: ID;
  /** Text wurde mit KI-Unterstützung formuliert und von einem Menschen bestätigt */
  aiAssisted: boolean;
  closedById?: ID;
  closedAt?: ISODateTime;
}

/** Generische Quelle, damit CAPA später auch Vorfälle oder Reklamationen bedient */
export interface ActionSource {
  type: "finding" | "incident" | "complaint" | "supplier_assessment";
  id: ID;
}

export type ActionKind =
  | "correction" // Korrektur / Sofortmaßnahme
  | "corrective_action" // Korrekturmaßnahme, beseitigt die Ursache
  | "improvement"; // Umsetzung eines Verbesserungspotenzials

export type ActionStatus = "open" | "in_progress" | "done" | "cancelled";

export interface CorrectiveAction {
  id: ID;
  /** Fachliche Nummer, z. B. "M-2026-004" */
  number: string;
  source: ActionSource;
  kind: ActionKind;
  title: string;
  description: string;
  ownerId: ID;
  dueDate: ISODate;
  status: ActionStatus;
  createdById: ID;
  createdAt: ISODateTime;
  completedAt?: ISODateTime;
  completionNote?: string;
  evidenceIds: ID[];
}

export type EffectivenessResult = "effective" | "not_effective";

/** Vier-Augen-Prinzip: performedById und approvedById müssen verschieden sein */
export interface EffectivenessCheck {
  id: ID;
  findingId: ID;
  plannedDate: ISODate;
  method: string;
  performedById?: ID;
  performedAt?: ISODateTime;
  result: EffectivenessResult | null;
  comment?: string;
  approvedById?: ID;
  approvedAt?: ISODateTime;
}

/* ------------------------------------------------------------------ */
/* Bericht                                                             */
/* ------------------------------------------------------------------ */

export type ReportStatus = "draft" | "in_review" | "released" | "superseded";

export interface AuditReport {
  id: ID;
  auditId: ID;
  version: number;
  status: ReportStatus;
  summary: string;
  conclusion: string;
  strengths: string[];
  /** z. B. Originalbericht der Zertifizierungsstelle */
  attachmentEvidenceIds: ID[];
  distributionIds: ID[];
  createdById: ID;
  createdAt: ISODateTime;
  releasedById?: ID;
  releasedAt?: ISODateTime;
  supersedesReportId?: ID;
  /** Pflicht ab Version 2 */
  changeReason?: string;
  /** Hash über den freigegebenen Inhalt, gesetzt bei Freigabe */
  contentHash?: string;
  aiAssisted: boolean;
}

/* ------------------------------------------------------------------ */
/* Nachbarmodule (im Dummy nur lesend)                                 */
/* ------------------------------------------------------------------ */

export interface Risk {
  id: ID;
  /** z. B. "R-012" */
  code: string;
  title: string;
  siteId: ID | null;
  processId?: ID;
  likelihood: 1 | 2 | 3 | 4 | 5;
  severity: 1 | 2 | 3 | 4 | 5;
  ownerId: ID;
  sourceModule: "grc";
}

export interface Kpi {
  id: ID;
  code: string;
  name: string;
  unit: string;
  /** Thematischer Bezug zum ESRS, bewusst nur auf Themenebene (E1, S1 ...) */
  esrsTopic: string;
  module: "ehs" | "energy" | "environment";
  latestValue?: number;
  period?: string;
}

/* ------------------------------------------------------------------ */
/* Audit-Trail                                                         */
/* ------------------------------------------------------------------ */

export type EntityType =
  | "programme"
  | "audit"
  | "plan_slot"
  | "checklist"
  | "checklist_item"
  | "evidence"
  | "finding"
  | "action"
  | "effectiveness_check"
  | "report"
  | "catalog";

export type EventAction =
  | "created"
  | "updated"
  | "status_changed"
  | "assigned"
  | "unassigned"
  | "rated"
  | "evidence_attached"
  | "linked"
  | "released"
  | "version_created"
  | "warning_overridden"
  | "ai_suggestion_accepted"
  | "ai_suggestion_rejected";

export interface FieldChange {
  field: string;
  before: JsonValue;
  after: JsonValue;
}

/** Entwurf eines Events, bevor Sequenz und Hash vergeben werden */
export interface AuditEventDraft {
  timestamp: ISODateTime;
  actorId: ID;
  actorRole: RoleKey;
  entityType: EntityType;
  entityId: ID;
  /** Für Filterung im Audit-Detail, gesetzt wenn das Objekt zu einem Audit gehört */
  auditId?: ID;
  action: EventAction;
  /** Menschenlesbare Zusammenfassung auf Deutsch */
  summary: string;
  changes?: FieldChange[];
  reason?: string;
  aiGenerated: boolean;
}

/** Append-only. Hash-Verkettung macht Manipulation erkennbar. */
export interface AuditEvent extends AuditEventDraft {
  id: ID;
  sequence: number;
  prevHash: string;
  hash: string;
}

/* ------------------------------------------------------------------ */
/* Gesamter Datenbestand                                               */
/* ------------------------------------------------------------------ */

export interface SeedData {
  organisation: Organisation;
  sites: Site[];
  processes: Process[];
  persons: Person[];
  standards: Standard[];
  requirements: Requirement[];
  catalogs: QuestionCatalog[];
  programmes: AuditProgramme[];
  audits: Audit[];
  planSlots: AuditPlanSlot[];
  checklists: Checklist[];
  evidence: Evidence[];
  findings: Finding[];
  actions: CorrectiveAction[];
  effectivenessChecks: EffectivenessCheck[];
  reports: AuditReport[];
  risks: Risk[];
  kpis: Kpi[];
  events: AuditEvent[];
}
