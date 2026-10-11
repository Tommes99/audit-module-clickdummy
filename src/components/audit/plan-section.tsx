"use client";

import { useMemo } from "react";
import { EntityChip } from "@/components/shared/entity-chip";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { formatDate } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";
import type { Audit, AuditPlanSlot } from "@/types/domain";

const timeFormat = new Intl.DateTimeFormat("de-DE", { timeStyle: "short", timeZone: "Europe/Berlin" });
const weekdayFormat = new Intl.DateTimeFormat("de-DE", { weekday: "long", timeZone: "Europe/Berlin" });
const dayKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" });

const gridCols = "lg:grid-cols-[8.5rem_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)]";

function SlotRow({ slot, names }: { slot: AuditPlanSlot; names: string }) {
  return (
    <li className={`grid gap-x-4 gap-y-1 px-4 py-2.5 text-sm ${gridCols}`}>
      <span className="tnum whitespace-nowrap text-muted-foreground">
        {timeFormat.format(new Date(slot.start))} bis {timeFormat.format(new Date(slot.end))}
      </span>
      <div className="min-w-0">
        <p className="font-medium">{slot.topic}</p>
        {slot.location && <p className="text-xs text-muted-foreground">{slot.location}</p>}
      </div>
      <div className="flex min-w-0 flex-wrap content-start items-center gap-1">
        {slot.processId && <EntityChip kind="process" id={slot.processId} />}
        {slot.requirementIds.map((id) => (
          <EntityChip key={id} kind="requirement" id={id} showTitle={false} />
        ))}
      </div>
      <span className="text-xs leading-5 text-muted-foreground">{names}</span>
    </li>
  );
}

/** Auditplan nach Tagen gruppiert: Zeit, Thema und Ort, Prozess mit Anforderungen, Teilnehmende */
export function PlanSection({ audit }: { audit: Audit }) {
  const planSlots = useAppStore((s) => s.data.planSlots);
  const persons = useAppStore((s) => s.data.persons);
  const days = useMemo(() => {
    const slots = planSlots.filter((s) => s.auditId === audit.id).sort((a, b) => a.start.localeCompare(b.start));
    const map = new Map<string, AuditPlanSlot[]>();
    for (const s of slots) {
      const key = dayKey.format(new Date(s.start));
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.values()];
  }, [planSlots, audit.id]);
  const nameOf = (id: string) => persons.find((p) => p.id === id)?.name ?? id;

  return (
    <section aria-labelledby="sec-plan">
      <div id="sec-plan">
        <SectionTitle help="audit.plan" count={days.reduce((n, d) => n + d.length, 0)}>
          Auditplan
        </SectionTitle>
      </div>
      {days.length === 0 ? (
        <EmptyState>Noch kein Auditplan hinterlegt. Zeitslots sind im Clickdummy nur für die Demo-Audits vorbereitet.</EmptyState>
      ) : (
        <Panel padded={false}>
          <div className={`hidden gap-x-4 border-b border-border bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground lg:grid ${gridCols}`}>
            <span>Zeit</span>
            <span>Thema und Ort</span>
            <span>Prozess und Anforderungen</span>
            <span>Teilnehmende</span>
          </div>
          {days.map((slots) => (
            <div key={slots[0].start} className="border-b border-border last:border-b-0">
              <h3 className="tnum border-b border-border bg-muted/20 px-4 py-1.5 text-xs font-semibold">
                {weekdayFormat.format(new Date(slots[0].start))}, {formatDate(slots[0].start)}
              </h3>
              <ul className="divide-y divide-border">
                {slots.map((s) => (
                  <SlotRow key={s.id} slot={s} names={s.participantIds.map(nameOf).join(", ")} />
                ))}
              </ul>
            </div>
          ))}
        </Panel>
      )}
    </section>
  );
}
