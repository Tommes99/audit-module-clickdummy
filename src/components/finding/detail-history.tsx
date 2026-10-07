"use client";

import { useMemo } from "react";
import { SectionTitle } from "@/components/shared/page-header";
import { EventTimeline } from "@/components/shared/event-timeline";
import { useAppStore } from "@/store/app-store";
import type { Finding } from "@/types/domain";

/** Mini-Verlauf: Events der Feststellung, ihrer Maßnahmen und der Wirksamkeitsprüfung, neueste zuerst */
export function DetailHistory({ finding }: { finding: Finding }) {
  const allEvents = useAppStore((s) => s.data.events);
  const events = useMemo(() => {
    const ids = new Set<string>([finding.id, ...finding.actionIds, ...(finding.effectivenessCheckId ? [finding.effectivenessCheckId] : [])]);
    return allEvents.filter((e) => ids.has(e.entityId)).sort((a, b) => b.sequence - a.sequence);
  }, [allEvents, finding.id, finding.actionIds, finding.effectivenessCheckId]);

  return (
    <section id="verlauf" aria-label="Verlauf" className="scroll-mt-24">
      <SectionTitle help="finding.history" count={events.length}>
        Verlauf
      </SectionTitle>
      <EventTimeline events={events} compact emptyText="Noch keine Einträge im Verlauf dieser Feststellung." />
    </section>
  );
}
