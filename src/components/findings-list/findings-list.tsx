"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/shared/page-header";
import { QuickChips } from "@/components/actions/actions-filters";
import { FindingsFilterBar } from "@/components/findings-list/findings-filter-bar";
import { FindingsTable } from "@/components/findings-list/findings-table";
import {
  EMPTY_FINDING_FILTERS,
  QUICK_FILTERS,
  isQuickFilter,
  matchesFilters,
  type FindingFilterState,
  type QuickFilter,
} from "@/components/findings-list/findings-filter";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";

/** Alle Feststellungen über alle Audits: Schnellfilter, Filterleiste, Tabelle. Nur lesend. */
export function FindingsList() {
  const data = useAppStore((s) => s.data);
  const params = useSearchParams();
  const [filters, setFilters] = useState<FindingFilterState>(() => {
    const q = params.get("filter");
    return { ...EMPTY_FINDING_FILTERS, quick: isQuickFilter(q) ? q : "" };
  });

  const sorted = useMemo(
    () => [...data.findings].sort((a, b) => b.number.localeCompare(a.number)),
    [data.findings],
  );
  const shown = useMemo(
    () => sorted.filter((f) => matchesFilters(f, filters)),
    [sorted, filters],
  );
  const quick = useMemo(
    () =>
      QUICK_FILTERS.map((q) => ({
        value: q.value,
        label: q.label,
        count: sorted.filter(q.test).length,
      })),
    [sorted],
  );
  const sites = useMemo(
    () => [
      ...data.sites.map((s) => ({ value: s.id, label: s.name })),
      { value: "none", label: "Lieferant" },
    ],
    [data.sites],
  );
  const auditNumbers = useMemo(
    () => new Map(data.audits.map((a) => [a.id, a.number])),
    [data.audits],
  );
  const siteName = (id: string | null) =>
    id ? (data.sites.find((s) => s.id === id)?.name ?? "") : "Lieferant";

  return (
    <section className="space-y-4">
      <QuickChips
        items={quick}
        active={filters.quick}
        onPick={(v) =>
          setFilters((f) => ({ ...f, quick: v as QuickFilter | "" }))
        }
      />
      <FindingsFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        sites={sites}
        shown={shown.length}
        total={sorted.length}
      />
      {shown.length === 0 ? (
        <EmptyState>
          {sorted.length === 0
            ? "Noch keine Feststellungen. Legen Sie eine aus einem Checklistenpunkt in einem Audit an."
            : "Keine Feststellungen für diese Filter. Setzen Sie die Filter zurück."}
        </EmptyState>
      ) : (
        <FindingsTable
          findings={shown}
          auditNumbers={auditNumbers}
          siteName={siteName}
          personName={(id) => personName(data, id)}
        />
      )}
    </section>
  );
}
