"use client";

import { useAppStore } from "@/store/app-store";
import { eventActionLabels, formatDateTime, roleLabels } from "@/domain/labels";
import { AiBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/page-header";
import { HelpHint } from "@/components/shared/help-hint";
import { Panel } from "@/components/shared/panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrailObject } from "@/components/trail/trail-object";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/types/domain";

/** Demo-Aktionen (Abkürzungen für die Vorführung) sind im Verlauf ausdrücklich erkennbar */
const isDemoAction = (e: AuditEvent) => e.summary.startsWith("Demo-Abkürzung");

function Hash({ event }: { event: AuditEvent }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="font-mono text-xs text-muted-foreground" />}>{event.hash.slice(0, 8)}</TooltipTrigger>
      <TooltipContent className="max-w-sm break-all font-mono">
        <span className="block">Hash: {event.hash}</span>
        <span className="block">Vorgänger: {event.prevHash}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/** Dichte Tabelle des globalen Verlaufs: Zeit, Person, Zusammenfassung, Objekt, Hash */
export function TrailTable({ events, emptyText }: { events: AuditEvent[]; emptyText: string }) {
  const persons = useAppStore((s) => s.data.persons);
  if (events.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <Panel padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="w-36 px-3 py-2 font-medium">Zeit</th>
              <th scope="col" className="w-48 px-3 py-2 font-medium">Person</th>
              <th scope="col" className="px-3 py-2 font-medium">Zusammenfassung</th>
              <th scope="col" className="w-40 px-3 py-2 font-medium">Objekt</th>
              <th scope="col" className="w-28 px-3 py-2 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  Hash <HelpHint topic="trail.hash" side="left" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className={cn("border-b border-border align-top last:border-0", e.aiGenerated && "bg-info-soft/40")}>
                  <td className="tnum whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                    <time dateTime={e.timestamp}>{formatDateTime(e.timestamp)}</time>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block font-medium">{persons.find((p) => p.id === e.actorId)?.name ?? e.actorId}</span>
                    <span className="block text-xs text-muted-foreground">{roleLabels[e.actorRole]}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{e.summary}</span>
                      {e.aiGenerated && <AiBadge />}
                      {isDemoAction(e) && (
                        <span className="inline-flex h-5 items-center rounded-full border border-border bg-muted/60 px-2 text-xs font-medium text-muted-foreground">Demo-Aktion</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{eventActionLabels[e.action]}</p>
                    {e.reason && (
                      <p className="mt-1 text-xs">
                        <span className="text-muted-foreground">Begründung:</span> {e.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <TrailObject event={e} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="tnum block text-xs text-muted-foreground">#{e.sequence}</span>
                    <Hash event={e} />
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
