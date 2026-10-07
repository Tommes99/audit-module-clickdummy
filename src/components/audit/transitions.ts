import type { AuditStatus } from "@/types/domain";

/** Beschriftung, Erfolgsmeldung und Rechteprüfung je Statusübergang eines Audits */
export interface TransitionConfig {
  label: string;
  success: string;
  /** plan: nur Auditprogramm-Verantwortliche, run: auch zugewiesenes Auditteam */
  permission: "plan_audit" | "edit_checklist";
  reasonTitle?: string;
  reasonDescription?: string;
}

export const auditTransitionConfig: Record<string, TransitionConfig> = {
  "planned->in_preparation": { label: "Vorbereitung starten", success: "Vorbereitung gestartet", permission: "plan_audit" },
  "in_preparation->in_progress": { label: "Audit starten", success: "Audit gestartet", permission: "edit_checklist" },
  "in_progress->reporting": { label: "Berichtserstellung starten", success: "Berichtserstellung gestartet", permission: "edit_checklist" },
  "reporting->in_progress": {
    label: "Zurück in Durchführung",
    success: "Audit zurück in Durchführung gesetzt",
    permission: "edit_checklist",
    reasonTitle: "Zurück in Durchführung",
    reasonDescription: "Die Begründung wird im Verlauf protokolliert.",
  },
  "released->closed": { label: "Audit abschließen", success: "Audit abgeschlossen", permission: "plan_audit" },
  "planned->cancelled": {
    label: "Audit absagen",
    success: "Audit abgesagt",
    permission: "plan_audit",
    reasonTitle: "Audit absagen",
    reasonDescription: "Die Begründung wird im Verlauf protokolliert.",
  },
  "in_preparation->cancelled": {
    label: "Audit absagen",
    success: "Audit abgesagt",
    permission: "plan_audit",
    reasonTitle: "Audit absagen",
    reasonDescription: "Die Begründung wird im Verlauf protokolliert.",
  },
  "in_preparation->planned": {
    label: "Zurück auf Geplant",
    success: "Audit zurück auf Geplant gesetzt",
    permission: "plan_audit",
    reasonTitle: "Zurück auf Geplant",
    reasonDescription: "Die Begründung wird im Verlauf protokolliert.",
  },
};

/** Der nächste Vorwärtsübergang je Status, dessen Blocker und Warnungen direkt unter den Buttons stehen */
export const forwardTransition: Partial<Record<AuditStatus, AuditStatus>> = {
  planned: "in_preparation",
  in_preparation: "in_progress",
  in_progress: "reporting",
  reporting: "released",
  released: "closed",
};

/** Das Auditteam ist nur vor dem Start der Durchführung änderbar */
export const isTeamEditable = (status: AuditStatus) => status === "planned" || status === "in_preparation";
