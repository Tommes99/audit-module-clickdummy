import type { AuditEvent, EntityType, EventAction, ID } from "@/types/domain";

export interface TrailFilter {
  auditId: ID | "";
  actorId: ID | "";
  entityType: EntityType | "";
  action: EventAction | "";
  aiOnly: boolean;
  query: string;
}

export const emptyTrailFilter: TrailFilter = { auditId: "", actorId: "", entityType: "", action: "", aiOnly: false, query: "" };

/** Filtert Events, neueste zuerst (nach Sequenz absteigend) */
export function filterEvents(events: AuditEvent[], f: TrailFilter): AuditEvent[] {
  const q = f.query.trim().toLowerCase();
  return events
    .filter(
      (e) =>
        (!f.auditId || e.auditId === f.auditId) &&
        (!f.actorId || e.actorId === f.actorId) &&
        (!f.entityType || e.entityType === f.entityType) &&
        (!f.action || e.action === f.action) &&
        (!f.aiOnly || e.aiGenerated) &&
        (!q || e.summary.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.sequence - a.sequence);
}
