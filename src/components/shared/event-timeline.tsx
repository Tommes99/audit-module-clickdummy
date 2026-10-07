"use client";

import { useAppStore } from "@/store/app-store";
import {
  actionStatusLabels,
  auditStatusLabels,
  catalogStatusLabels,
  checklistRatingLabels,
  effectivenessResultLabels,
  eventActionLabels,
  entityTypeLabels,
  findingStatusLabels,
  formatDateTime,
  reportStatusLabels,
  roleLabels,
} from "@/domain/labels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/page-header";
import { AiBadge } from "@/components/shared/status-badge";
import type { AuditEvent, EntityType, JsonValue, SeedData } from "@/types/domain";
import { cn } from "@/lib/utils";

const fieldLabels: Record<string, string> = {
  status: "Status",
  rating: "Bewertung",
  notes: "Notiz",
  auditorIds: "Auditteam",
  result: "Ergebnis",
  riskIds: "Risiken",
  kpiIds: "Kennzahlen",
  title: "Titel",
  description: "Beschreibung",
  classification: "Klassifizierung",
  requirementIds: "Anforderungen",
  processId: "Prozess",
  ownerId: "Verantwortliche:r",
  dueDate: "Frist",
  summary: "Zusammenfassung",
  conclusion: "Gesamtbewertung",
  strengths: "Stärken",
  rootCause: "Ursache",
  unratedItems: "Unbewertete Punkte",
};

function statusLabel(entity: EntityType, value: string): string | undefined {
  if (entity === "audit") return auditStatusLabels[value as keyof typeof auditStatusLabels]?.label;
  if (entity === "finding") return findingStatusLabels[value as keyof typeof findingStatusLabels]?.label;
  if (entity === "action") return actionStatusLabels[value as keyof typeof actionStatusLabels]?.label;
  if (entity === "report") return reportStatusLabels[value as keyof typeof reportStatusLabels]?.label;
  if (entity === "catalog") return catalogStatusLabels[value as keyof typeof catalogStatusLabels]?.label;
  return undefined;
}

function valueText(data: SeedData, entity: EntityType, field: string, value: JsonValue): string {
  if (value === null || value === undefined || value === "") return "leer";
  if (field === "status" && typeof value === "string") return statusLabel(entity, value) ?? value;
  if (field === "rating" && typeof value === "string") return checklistRatingLabels[value as keyof typeof checklistRatingLabels]?.label ?? value;
  if (field === "result" && typeof value === "string") return effectivenessResultLabels[value as keyof typeof effectivenessResultLabels]?.label ?? value;
  const lookup = (id: string) =>
    data.persons.find((p) => p.id === id)?.name ?? data.risks.find((r) => r.id === id)?.code ?? data.kpis.find((k) => k.id === id)?.code ?? data.processes.find((p) => p.id === id)?.name ?? id;
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? lookup(v) : String(v))).join(", ") || "leer";
  if (typeof value === "string") return lookup(value);
  return String(value);
}

function ShortHash({ hash, prevHash }: { hash: string; prevHash: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="font-mono text-xs text-muted-foreground" />}>
        {hash.slice(0, 8)}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm break-all font-mono">
        <span className="block">Hash: {hash}</span>
        <span className="block">Vorgänger: {prevHash}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Append-only Verlauf: Zeit, Person und Rolle, Zusammenfassung, Änderung mit vorher und nachher, Begründung, kleiner Hash.
 * KI-Einträge tragen das Label "KI-gestützt". Kompakt (Seitenspalte): Zusammenfassung vorn, Zeit und Person darunter.
 */
export function EventTimeline({ events, emptyText, compact = false }: { events: AuditEvent[]; emptyText?: string; compact?: boolean }) {
  const data = useAppStore((s) => s.data);
  if (events.length === 0) return <EmptyState>{emptyText ?? "Noch keine Einträge im Verlauf."}</EmptyState>;
  const who = (e: AuditEvent) => `${data.persons.find((p) => p.id === e.actorId)?.name ?? e.actorId}, ${roleLabels[e.actorRole]}`;
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {events.map((e) => (
        <li
          key={e.id}
          className={cn("px-3 py-2.5 text-sm", !compact && "grid gap-x-4 gap-y-1 sm:grid-cols-[9.5rem_1fr_auto]", e.aiGenerated && "bg-info-soft/40")}
        >
          {!compact && (
            <time dateTime={e.timestamp} className="tnum text-xs text-muted-foreground sm:pt-0.5">
              {formatDateTime(e.timestamp)}
            </time>
          )}
          <div className="min-w-0">
            <p className="font-medium leading-snug">
              {e.summary}
              {e.aiGenerated && <AiBadge className="ml-2 align-middle" />}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {compact && (
                <>
                  <time dateTime={e.timestamp} className="tnum">
                    {formatDateTime(e.timestamp)}
                  </time>
                  {" · "}
                </>
              )}
              {who(e)}
              {!compact && (
                <>
                  {" · "}
                  {eventActionLabels[e.action]} · {entityTypeLabels[e.entityType]}
                </>
              )}
            </p>
            {!compact && e.changes && e.changes.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs">
                {e.changes.map((c) => (
                  <li key={c.field}>
                    <span className="text-muted-foreground">{fieldLabels[c.field] ?? c.field}:</span> {valueText(data, e.entityType, c.field, c.before)}
                    {" → "}
                    <span className="font-medium">{valueText(data, e.entityType, c.field, c.after)}</span>
                  </li>
                ))}
              </ul>
            )}
            {e.reason && (
              <p className="mt-1 text-xs">
                <span className="text-muted-foreground">Begründung:</span> {e.reason}
              </p>
            )}
            {compact && (
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="tnum">#{e.sequence}</span>
                <ShortHash hash={e.hash} prevHash={e.prevHash} />
              </p>
            )}
          </div>
          {!compact && (
            <div className="flex items-start gap-2 sm:justify-end">
              <span className="tnum text-xs text-muted-foreground">#{e.sequence}</span>
              <ShortHash hash={e.hash} prevHash={e.prevHash} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
