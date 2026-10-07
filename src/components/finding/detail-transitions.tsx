"use client";

import { useMemo } from "react";
import { GuardHint } from "@/components/shared/guard-hint";
import { TransitionButton } from "@/components/shared/transition-button";
import { useFindingRights, type FindingRights } from "@/components/finding/detail-rights";
import { useAppStore } from "@/store/app-store";
import { checkFindingTransition } from "@/domain/rules";
import { findingTransitions, requiresReason } from "@/domain/workflows";
import { formatDateTime } from "@/domain/labels";
import type { PermissionResult } from "@/domain/permissions";
import type { Finding, FindingStatus } from "@/types/domain";

type PermissionKind = "respond" | "checklist" | "capa" | "verify" | "close";

interface TransitionDef {
  label: string;
  success: string;
  permission: PermissionKind;
  primary?: boolean;
  reason?: { title: string; description: string };
}

/** Beschriftung, Meldung und Berechtigung je Übergang (Status von->nach) */
const defs: Partial<Record<string, TransitionDef>> = {
  "draft->open": { label: "An Auditee übergeben", success: "Feststellung an Auditee übergeben", permission: "checklist", primary: true },
  "open->accepted": { label: "Annehmen", success: "Feststellung angenommen", permission: "respond", primary: true },
  "open->rejected": {
    label: "Zurückweisen",
    success: "Feststellung zurückgewiesen",
    permission: "respond",
    reason: { title: "Feststellung zurückweisen", description: "Begründen Sie, warum die Feststellung nicht zutrifft. Die Begründung wird im Verlauf festgehalten." },
  },
  "rejected->open": { label: "Erneut übergeben", success: "Feststellung erneut übergeben", permission: "checklist", primary: true },
  "rejected->closed": {
    label: "Zurückweisung akzeptieren und schließen",
    success: "Zurückweisung akzeptiert und Feststellung geschlossen",
    permission: "checklist",
    reason: { title: "Zurückweisung akzeptieren und schließen", description: "Begründen Sie, warum die Zurückweisung akzeptiert wird." },
  },
  "accepted->in_treatment": { label: "In Bearbeitung setzen", success: "Feststellung in Bearbeitung gesetzt", permission: "capa", primary: true },
  "in_treatment->effectiveness_check": { label: "Zur Wirksamkeitsprüfung", success: "Zur Wirksamkeitsprüfung übergeben", permission: "capa", primary: true },
  "effectiveness_check->closed": { label: "Schließen", success: "Feststellung geschlossen", permission: "verify", primary: true },
  "effectiveness_check->in_treatment": {
    label: "Zurück in Bearbeitung",
    success: "Feststellung zurück in Bearbeitung gesetzt",
    permission: "verify",
    reason: { title: "Zurück in Bearbeitung", description: "Begründen Sie, warum die Maßnahmen nicht ausreichen. Die Begründung wird im Verlauf festgehalten." },
  },
  "open->closed": { label: "Schließen", success: "Feststellung geschlossen", permission: "close" },
  "accepted->closed": { label: "Schließen", success: "Feststellung geschlossen", permission: "close" },
};

function resolvePermission(kind: PermissionKind, rights: FindingRights): PermissionResult {
  switch (kind) {
    case "respond":
      return rights.respond;
    case "checklist":
      return rights.editChecklist;
    case "capa":
      return rights.capa;
    case "verify":
      return rights.verify;
    case "close":
      return rights.editChecklist.allowed || rights.respond.allowed
        ? { allowed: true }
        : { allowed: false, reason: "Nur für das Auditteam und Verantwortliche des Prozesses" };
  }
}

/** Guard, Berechtigung und Definition eines Übergangs (Guards kommen aus rules.ts, Warnungen blockieren nicht) */
function useTransition(finding: Finding, to: FindingStatus) {
  const data = useAppStore((s) => s.data);
  const rights = useFindingRights(finding);
  const guard = useMemo(() => checkFindingTransition(finding, to, data), [finding, to, data]);
  const def = defs[`${finding.status}->${to}`];
  const permission = def ? resolvePermission(def.permission, rights) : undefined;
  return { guard, def, permission };
}

/**
 * Ein Statuswechsel-Button mit Blockern als Tooltip und (außer bei hideHint) als GuardHint direkt darunter.
 */
export function FindingTransitionButton({ finding, to, hideHint = false }: { finding: Finding; to: FindingStatus; hideHint?: boolean }) {
  const transitionFinding = useAppStore((s) => s.transitionFinding);
  const { guard, def, permission } = useTransition(finding, to);
  if (!def || !permission) return null;

  const reasonNeeded = requiresReason("finding", finding.status, to);
  return (
    <div className="max-w-md space-y-2">
      <TransitionButton
        label={def.label}
        variant={def.primary ? "default" : "outline"}
        run={(reason) => transitionFinding(finding.id, to, reason)}
        successMessage={def.success}
        blockers={guard.blockers}
        deniedReason={permission.allowed ? undefined : permission.reason}
        reasonDialog={reasonNeeded && def.reason ? { ...def.reason, confirmLabel: def.label } : undefined}
      />
      {!hideHint && permission.allowed && <GuardHint blockers={guard.blockers} warnings={guard.warnings} />}
    </div>
  );
}

function TransitionHint({ finding, to }: { finding: Finding; to: FindingStatus }) {
  const { guard, def, permission } = useTransition(finding, to);
  // Nur der primäre Übergang erklärt seine Blocker unter dem Kopf, nachrangige zeigen sie im Tooltip
  if (!def?.primary || !permission?.allowed) return null;
  return <GuardHint blockers={guard.blockers} warnings={guard.warnings} />;
}

/** Erlaubte Übergänge als Buttons (nur was workflows.ts für den aktuellen Status erlaubt), der primäre zuerst */
export function DetailTransitionButtons({ finding }: { finding: Finding }) {
  const targets = findingTransitions[finding.status];
  return (
    <>
      {targets.map((to) => (
        <FindingTransitionButton key={to} finding={finding} to={to} hideHint />
      ))}
    </>
  );
}

/** Blocker und Warnungen der erlaubten Übergänge, direkt unter dem Kopf */
export function DetailTransitionHints({ finding }: { finding: Finding }) {
  const targets = findingTransitions[finding.status];
  return (
    <div className="space-y-2 empty:hidden sm:max-w-xl">
      {targets.map((to) => (
        <TransitionHint key={to} finding={finding} to={to} />
      ))}
    </div>
  );
}

/** Hinweis zum Abschluss, wenn keine Übergänge mehr möglich sind */
export function ClosedNote({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  if (findingTransitions[finding.status].length > 0) return null;
  const closer = data.persons.find((p) => p.id === finding.closedById)?.name;
  return (
    <span>
      Geschlossen
      {finding.closedAt && (
        <>
          {" "}am <span className="tnum">{formatDateTime(finding.closedAt)}</span>
        </>
      )}
      {closer && <>, durch {closer}</>}
    </span>
  );
}
