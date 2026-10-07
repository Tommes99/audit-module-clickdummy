"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EventTimeline } from "@/components/shared/event-timeline";
import { SectionTitle } from "@/components/shared/page-header";
import { eventsFor } from "@/lib/audit-trail";
import { useAppStore } from "@/store/app-store";

/** Tab "Verlauf": append-only Protokoll aller Änderungen an diesem Audit */
export function HistoryTab({ auditId }: { auditId: string }) {
  const events = useAppStore((s) => s.data.events);
  const list = useMemo(() => eventsFor(events, { auditId }), [events, auditId]);

  return (
    <section aria-labelledby="sec-history">
      <div id="sec-history">
        <SectionTitle
          help="audit.history"
          count={list.length}
          actions={
            <Link href="/verlauf" className="text-sm text-primary hover:underline underline-offset-2">
              Integrität im globalen Verlauf prüfen
            </Link>
          }
        >
          Verlauf
        </SectionTitle>
      </div>
      <EventTimeline events={list} />
    </section>
  );
}
