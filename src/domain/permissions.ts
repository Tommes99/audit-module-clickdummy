import type { Audit, CorrectiveAction, Finding, ID, Process, RoleKey } from "@/types/domain";

/**
 * Rechte im Dummy: nur UI-Steuerung (Buttons ausblenden oder deaktivieren mit Tooltip),
 * keine technische Durchsetzung. Matrix siehe CLAUDE.md Abschnitt 9.
 */

export interface Session {
  personId: ID;
  role: RoleKey;
}

/** Die fünf Demo-Personas des Rollenwechslers */
export const demoPersonas: { personId: ID; role: RoleKey }[] = [
  { personId: "p-keller", role: "programme_manager" },
  { personId: "p-brandt", role: "auditor" },
  { personId: "p-richter", role: "auditee" },
  { personId: "p-demir", role: "action_owner" },
  { personId: "p-schulz", role: "management" },
];

export type Permission =
  | "plan_audit"
  | "edit_checklist"
  | "provide_evidence"
  | "respond_finding"
  | "edit_capa"
  | "complete_action"
  | "verify_effectiveness"
  | "release_report"
  | "manage_catalog";

export interface PermissionContext {
  audit?: Audit;
  finding?: Finding;
  action?: CorrectiveAction;
  processes?: Process[];
}

export interface PermissionResult {
  allowed: boolean;
  /** Tooltip-Text, z. B. "Nur für Auditprogramm-Verantwortliche" */
  reason?: string;
}

const yes: PermissionResult = { allowed: true };
const no = (reason: string): PermissionResult => ({ allowed: false, reason });

function ownsFinding(session: Session, ctx: PermissionContext): boolean {
  const { finding, processes = [] } = ctx;
  if (!finding) return false;
  if (finding.ownerId === session.personId) return true;
  return processes.find((p) => p.id === finding.processId)?.ownerId === session.personId;
}

export function can(session: Session, permission: Permission, ctx: PermissionContext = {}): PermissionResult {
  const { role, personId } = session;
  switch (permission) {
    case "plan_audit":
      return role === "programme_manager" ? yes : no("Nur für Auditprogramm-Verantwortliche");

    case "edit_checklist":
      if (role === "programme_manager") return yes;
      if (role === "auditor") {
        return !ctx.audit || ctx.audit.auditorIds.includes(personId)
          ? yes
          : no("Nur für das Auditteam dieses Audits");
      }
      return no("Nur für Auditprogramm-Verantwortliche und das Auditteam");

    case "provide_evidence":
      return role === "management" ? no("Nicht für die Geschäftsführung") : yes;

    case "respond_finding":
      if (role !== "auditee") return no("Nur für Auditees");
      return ownsFinding(session, ctx) ? yes : no("Nur für Verantwortliche des betroffenen Prozesses");

    case "edit_capa":
      // Die Programmverantwortung koordiniert und darf Ursachenanalyse und Maßnahmen im Auftrag der Verantwortlichen erfassen
      if (role === "programme_manager") return yes;
      if (role === "auditee") return ownsFinding(session, ctx) ? yes : no("Nur für Verantwortliche des betroffenen Prozesses");
      if (role === "action_owner") {
        if (ctx.action) return ctx.action.ownerId === personId ? yes : no("Nur für eigene Maßnahmen");
        return ownsFinding(session, ctx) ? yes : no("Nur für Verantwortliche des Prozesses und Auditprogramm-Verantwortliche");
      }
      return no("Nur für Auditprogramm-Verantwortliche, Auditees und Maßnahmenverantwortliche");

    case "complete_action":
      if (role === "auditee") {
        return ctx.action?.ownerId === personId || ownsFinding(session, ctx) ? yes : no("Nur für Verantwortliche des betroffenen Prozesses");
      }
      if (role === "action_owner") return ctx.action?.ownerId === personId ? yes : no("Nur für eigene Maßnahmen");
      return no("Nur für Auditees und Maßnahmenverantwortliche");

    case "verify_effectiveness":
      return role === "programme_manager" || role === "auditor"
        ? yes
        : no("Nur für Auditprogramm-Verantwortliche und Auditor:innen");

    case "manage_catalog":
      return role === "programme_manager" ? yes : no("Nur für Auditprogramm-Verantwortliche");

    case "release_report":
      if (role === "programme_manager") return yes;
      if (role === "auditor") {
        return !ctx.audit || ctx.audit.leadAuditorId === personId ? yes : no("Nur für die Auditleitung");
      }
      return no("Nur für Auditprogramm-Verantwortliche und die Auditleitung");
  }
}
