"use client";

import { ActionStatusBadge } from "@/components/shared/status-badge";
import { DueText } from "@/components/shared/due-text";
import { TransitionButton } from "@/components/shared/transition-button";
import { DetailActionDone } from "@/components/finding/detail-action-done";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import { actionChangeLockedBy, checkActionTransition } from "@/domain/rules";
import { actionTransitions, requiresReason } from "@/domain/workflows";
import { formatDateTime } from "@/domain/labels";
import { useCan } from "@/hooks/use-can";
import type { ActionStatus, CorrectiveAction, Finding } from "@/types/domain";

interface StatusButtonDef {
  label: string;
  success: string;
  /** Berechtigung edit_capa statt complete_action */
  needsCapa?: boolean;
  reason?: { title: string; description: string };
}

const discard: StatusButtonDef = {
  label: "Verwerfen",
  success: "Maßnahme verworfen",
  needsCapa: true,
  reason: { title: "Maßnahme verwerfen", description: "Begründen Sie, warum die Maßnahme nicht umgesetzt wird." },
};

const buttonDefs: Record<string, StatusButtonDef> = {
  "open->in_progress": { label: "In Umsetzung setzen", success: "Maßnahme in Umsetzung gesetzt" },
  "in_progress->open": { label: "Zurück auf Offen", success: "Maßnahme zurück auf Offen gesetzt" },
  "open->cancelled": discard,
  "in_progress->cancelled": discard,
  "done->in_progress": {
    label: "Wiedereröffnen",
    success: "Maßnahme wiedereröffnet",
    needsCapa: true,
    reason: { title: "Maßnahme wiedereröffnen", description: "Begründen Sie, warum die Maßnahme erneut bearbeitet wird." },
  },
};

/** Eine Maßnahme als Zeile: Nummer, Titel, Beschreibung, Verantwortliche:r, Frist, Status und erlaubte Statusbuttons */
export function DetailActionRow({ action, finding }: { action: CorrectiveAction; finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const transitionAction = useAppStore((s) => s.transitionAction);
  const can = useCan();

  const complete = can("complete_action", { action, finding, processes: data.processes });
  const capa = can("edit_capa", { finding, action, processes: data.processes });
  // Während der Wirksamkeitsprüfung und nach dem Schließen keine Statusbuttons (Guard in rules.ts)
  const targets: ActionStatus[] = actionChangeLockedBy(finding).length > 0 ? [] : actionTransitions[action.status];

  return (
    <li className="space-y-2 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p>
            <span className="tnum font-medium">{action.number}</span> <span className="font-medium">{action.title}</span>
          </p>
          {action.description && <p className="mt-0.5 text-muted-foreground">{action.description}</p>}
        </div>
        <ActionStatusBadge status={action.status} />
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
        <span>Verantwortlich: {personName(data, action.ownerId)}</span>
        <span>
          Frist: <DueText dueDate={action.dueDate} done={action.status === "done" || action.status === "cancelled"} />
        </span>
        {action.completedAt && (
          <span>
            Erledigt am <span className="tnum">{formatDateTime(action.completedAt)}</span>
          </span>
        )}
      </p>
      {action.completionNote && (
        <p className="text-xs">
          <span className="text-muted-foreground">Notiz:</span> {action.completionNote}
        </p>
      )}
      {targets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {targets.map((to) => {
            if (to === "done") {
              return <DetailActionDone key={to} action={action} deniedReason={complete.allowed ? undefined : complete.reason} />;
            }
            const def = buttonDefs[`${action.status}->${to}`];
            if (!def) return null;
            const permission = def.needsCapa ? capa : complete;
            return (
              <TransitionButton
                key={to}
                label={def.label}
                size="sm"
                variant="outline"
                run={(reason) => transitionAction(action.id, to, reason)}
                successMessage={def.success}
                blockers={checkActionTransition(action, to, finding).blockers}
                deniedReason={permission.allowed ? undefined : permission.reason}
                reasonDialog={requiresReason("action", action.status, to) && def.reason ? { ...def.reason, confirmLabel: def.label } : undefined}
              />
            );
          })}
        </div>
      )}
    </li>
  );
}
