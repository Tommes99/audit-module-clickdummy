"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { useCan } from "@/hooks/use-can";
import type { PermissionContext, PermissionResult } from "@/domain/permissions";
import type { Audit, Finding } from "@/types/domain";

export interface FindingRights {
  audit: Audit | undefined;
  ctx: PermissionContext;
  /** Text, Klassifizierung, Zuständigkeit und Frist bearbeiten: nur das Auditteam (§9) */
  canEditFields: boolean;
  /** Risiken und Kennzahlen verknüpfen: Auditteam oder Auditee des Prozesses */
  canLink: boolean;
  editChecklist: PermissionResult;
  respond: PermissionResult;
  capa: PermissionResult;
  verify: PermissionResult;
  evidence: PermissionResult;
}

/** Bündelt die Rechteprüfungen der Feststellungsseite (nur UI-Steuerung) */
export function useFindingRights(finding: Finding): FindingRights {
  const data = useAppStore((s) => s.data);
  const can = useCan();
  return useMemo(() => {
    const audit = data.audits.find((a) => a.id === finding.auditId);
    const ctx: PermissionContext = { audit, finding, processes: data.processes };
    const editChecklist = can("edit_checklist", { audit });
    const respond = can("respond_finding", ctx);
    return {
      audit,
      ctx,
      canEditFields: editChecklist.allowed,
      canLink: editChecklist.allowed || respond.allowed,
      editChecklist,
      respond,
      capa: can("edit_capa", ctx),
      verify: can("verify_effectiveness", ctx),
      evidence: can("provide_evidence", ctx),
    };
  }, [data, finding, can]);
}
