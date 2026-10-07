import type { ActionStatus, AuditStatus, FindingStatus, ReportStatus } from "@/types/domain";

/**
 * Erlaubte Statusübergänge. Fachliche Bedingungen (Guards) stehen in rules.ts.
 * UI-Regel: Buttons für Statuswechsel werden nur für erlaubte Übergänge angezeigt.
 * Ist ein Guard nicht erfüllt, bleibt der Button sichtbar, aber deaktiviert,
 * mit Tooltip, der die Blocker nennt.
 */

export const auditTransitions: Record<AuditStatus, AuditStatus[]> = {
  planned: ["in_preparation", "cancelled"],
  in_preparation: ["in_progress", "planned", "cancelled"],
  in_progress: ["reporting"],
  reporting: ["released", "in_progress"],
  released: ["closed"],
  closed: [],
  cancelled: [],
};

export const findingTransitions: Record<FindingStatus, FindingStatus[]> = {
  draft: ["open"],
  open: ["accepted", "rejected", "closed"],
  accepted: ["in_treatment", "closed"],
  rejected: ["open", "closed"],
  in_treatment: ["effectiveness_check"],
  effectiveness_check: ["closed", "in_treatment"],
  closed: [],
};

export const actionTransitions: Record<ActionStatus, ActionStatus[]> = {
  open: ["in_progress", "done", "cancelled"],
  in_progress: ["done", "open", "cancelled"],
  done: ["in_progress"],
  cancelled: [],
};

/** released -> superseded passiert nur durch Anlegen einer neuen Version */
export const reportTransitions: Record<ReportStatus, ReportStatus[]> = {
  draft: ["in_review"],
  in_review: ["released", "draft"],
  released: ["superseded"],
  superseded: [],
};

/** Übergänge, die eine Begründung im Audit-Trail erfordern */
export const transitionsRequiringReason: string[] = [
  "audit:reporting->in_progress",
  "audit:in_preparation->planned",
  "audit:planned->cancelled",
  "audit:in_preparation->cancelled",
  "finding:open->rejected",
  "finding:rejected->closed",
  "finding:effectiveness_check->in_treatment",
  "action:done->in_progress",
  "action:open->cancelled",
  "action:in_progress->cancelled",
  "report:in_review->draft",
];

export function requiresReason(
  entity: "audit" | "finding" | "action" | "report",
  from: string,
  to: string,
): boolean {
  return transitionsRequiringReason.includes(`${entity}:${from}->${to}`);
}

/**
 * Feste Demo-Zeit, damit Fälligkeiten und Dashboard reproduzierbar sind.
 * Der 08.10.2026 ist Tag 1 des Demo-Audits A-2026-09.
 */
export const DEMO_TODAY = "2026-10-08";

/** Zeitstempel für neue Events: Demo-Datum plus aktuelle Uhrzeit */
export function demoNow(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${DEMO_TODAY}T${hh}:${mm}:${ss}+02:00`;
}
