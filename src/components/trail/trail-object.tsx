"use client";

import { EntityChip } from "@/components/shared/entity-chip";
import { entityTypeLabels } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";
import type { EntityKind } from "@/store/selectors";
import type { AuditEvent } from "@/types/domain";

/** Ordnet das Objekt eines Events einem klickbaren Chip zu. Untergeordnete Objekte zeigen auf das Hauptobjekt. */
function chipTarget(e: AuditEvent, findingIdOfCheck?: string): { kind: EntityKind; id: string } | null {
  switch (e.entityType) {
    case "audit":
      return { kind: "audit", id: e.entityId };
    case "finding":
      return { kind: "finding", id: e.entityId };
    case "action":
      return { kind: "action", id: e.entityId };
    case "catalog":
      return { kind: "catalog", id: e.entityId };
    case "effectiveness_check":
      return findingIdOfCheck ? { kind: "finding", id: findingIdOfCheck } : null;
    default:
      return e.auditId ? { kind: "audit", id: e.auditId } : null;
  }
}

/** Objekt des Eintrags: Objektart als Text, dazu Chip mit fachlicher Nummer */
export function TrailObject({ event }: { event: AuditEvent }) {
  const check = useAppStore((s) => (event.entityType === "effectiveness_check" ? s.data.effectivenessChecks.find((c) => c.id === event.entityId) : undefined));
  const target = chipTarget(event, check?.findingId);
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <span className="text-xs text-muted-foreground">{entityTypeLabels[event.entityType]}</span>
      {target && <EntityChip kind={target.kind} id={target.id} showTitle={false} />}
    </div>
  );
}
