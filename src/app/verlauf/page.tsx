"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { IntegrityButton, IntegrityResult, useIntegrityCheck } from "@/components/trail/integrity-check";
import { TrailFilters } from "@/components/trail/trail-filters";
import { TrailTable } from "@/components/trail/trail-table";
import { emptyTrailFilter, filterEvents, type TrailFilter } from "@/components/trail/trail-filter";
import { useAppStore } from "@/store/app-store";

const PAGE_SIZE = 50;

export default function TrailPage() {
  const events = useAppStore((s) => s.data.events);
  const [filter, setFilter] = useState<TrailFilter>(emptyTrailFilter);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const integrity = useIntegrityCheck(events);

  const filtered = useMemo(() => filterEvents(events, filter), [events, filter]);
  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  // Ändert sich ein Filter, beginnt die Liste wieder bei den ersten Einträgen
  const onChange = (patch: Partial<TrailFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Verlauf" help="trail.page" actions={<IntegrityButton onRun={integrity.run} />} />
      <IntegrityResult result={integrity.result} />
      <TrailFilters events={events} filter={filter} onChange={onChange} shown={filtered.length} total={events.length} />
      <TrailTable events={visible} emptyText="Keine Einträge für diese Filter. Passen Sie die Filter an." />
      {filtered.length > visible.length && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="tnum text-sm text-muted-foreground">{visible.length} von {filtered.length} angezeigt</span>
          <Button type="button" variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Weitere laden
          </Button>
        </div>
      )}
    </div>
  );
}
