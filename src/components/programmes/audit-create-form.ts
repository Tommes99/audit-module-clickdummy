import type { AuditDraft } from "@/store/commands/audit";
import type { AuditType, ID, RiskLevel } from "@/types/domain";

/** Formularstand "Audit planen". Begründungen als Freitext, eine Zeile je Grund. */
export interface AuditForm {
  type: AuditType;
  title: string;
  siteId: ID;
  supplierName: string;
  certificationBody: string;
  standardIds: ID[];
  processIds: ID[];
  plannedStart: string;
  plannedEnd: string;
  leadAuditorId: ID;
  objectives: string;
  scopeDescription: string;
  riskLevel: RiskLevel;
  riskReasons: string;
}

export type AuditFormPatch = (patch: Partial<AuditForm>) => void;

export const emptyAuditForm = (leadAuditorId: ID): AuditForm => ({
  type: "internal",
  title: "",
  siteId: "",
  supplierName: "",
  certificationBody: "",
  standardIds: [],
  processIds: [],
  plannedStart: "",
  plannedEnd: "",
  leadAuditorId,
  objectives: "",
  scopeDescription: "",
  riskLevel: "medium",
  riskReasons: "",
});

export const toAuditDraft = (f: AuditForm): AuditDraft => ({
  type: f.type,
  title: f.title,
  siteId: f.type === "supplier" ? null : f.siteId || null,
  supplierName: f.supplierName,
  certificationBody: f.certificationBody,
  standardIds: f.standardIds,
  processIds: f.processIds,
  plannedStart: f.plannedStart,
  plannedEnd: f.plannedEnd,
  leadAuditorId: f.leadAuditorId,
  objectives: f.objectives,
  scopeDescription: f.scopeDescription,
  riskLevel: f.riskLevel,
  riskReasons: f.riskReasons.split("\n"),
});
