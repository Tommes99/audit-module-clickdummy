"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { EmptyState } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import {
  ActionsFilterBar,
  EMPTY_FILTERS,
  NO_SITE,
  QuickChips,
  type ActionFilterState,
} from "@/components/actions/actions-filters";
import {
  actionColumns,
  compareRows,
  isOpen,
  type Names,
  type SortKey,
} from "@/components/actions/actions-columns";
import { useAppStore } from "@/store/app-store";
import { actionRows, personName, type ActionRow } from "@/store/selectors";

const matchesDue = (r: ActionRow, due: string) =>
  due === "open" ? isOpen(r) : r.state === due;

/** Alle Maßnahmen mit Schnellfiltern, Filtern und Sortierung (Standard: Frist aufsteigend, offene vor erledigten) */
export function ActionsTable() {
  const data = useAppStore((s) => s.data);
  const router = useRouter();
  const params = useSearchParams();
  const [filters, setFilters] = useState<ActionFilterState>(() => ({
    ...EMPTY_FILTERS,
    due: params.get("due") ?? "",
  }));
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "due",
    dir: "asc",
  });

  const rows = useMemo(() => actionRows(data), [data]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.status || r.action.status === filters.status) &&
          (!filters.due || matchesDue(r, filters.due)) &&
          (!filters.person || r.action.ownerId === filters.person) &&
          (!filters.site ||
            (filters.site === NO_SITE
              ? r.siteId === null
              : r.siteId === filters.site)),
      ),
    [rows, filters],
  );
  const owners = useMemo(
    () =>
      [...new Set(rows.map((r) => r.action.ownerId))]
        .map((id) => ({ value: id, label: personName(data, id) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [rows, data],
  );
  const sites = useMemo(
    () => [
      ...data.sites.map((s) => ({ value: s.id, label: s.name })),
      { value: NO_SITE, label: "Lieferant" },
    ],
    [data.sites],
  );
  const names = useMemo<Names>(
    () => ({
      person: (id) => personName(data, id),
      site: (id) =>
        id ? (data.sites.find((s) => s.id === id)?.name ?? id) : "Lieferant",
    }),
    [data],
  );
  const sorted = useMemo(
    () => [...filtered].sort(compareRows(sort.key, sort.dir, names)),
    [filtered, sort, names],
  );
  const quick = useMemo(
    () => [
      { value: "open", label: "Offen", count: rows.filter(isOpen).length },
      {
        value: "due_soon",
        label: "Bald fällig",
        count: rows.filter((r) => r.state === "due_soon").length,
      },
      {
        value: "overdue",
        label: "Überfällig",
        count: rows.filter((r) => r.state === "overdue").length,
      },
    ],
    [rows],
  );
  const toggleSort = (key: SortKey) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === "asc" ? "desc" : "asc",
    }));

  return (
    <section className="space-y-4">
      <QuickChips
        items={quick}
        active={filters.due}
        onPick={(due) => setFilters((f) => ({ ...f, due }))}
      />
      <ActionsFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        owners={owners}
        sites={sites}
        shown={filtered.length}
        total={rows.length}
      />

      {filtered.length === 0 ? (
        <EmptyState>
          {rows.length === 0
            ? "Noch keine Maßnahmen. Maßnahmen entstehen aus angenommenen Feststellungen."
            : "Keine Maßnahmen für diese Filter. Setzen Sie die Filter zurück."}
        </EmptyState>
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  {actionColumns.map((c) => {
                    const active = sort.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          active
                            ? sort.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        className="whitespace-nowrap px-1.5 py-1 font-medium first:pl-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={`inline-flex min-h-9 items-center gap-1 rounded-md px-1 hover:text-foreground ${active ? "text-foreground" : ""}`}
                          title={`Nach ${c.header} sortieren`}
                        >
                          {c.header}
                          {active &&
                            (sort.dir === "asc" ? (
                              <ArrowUp className="size-3" aria-hidden />
                            ) : (
                              <ArrowDown className="size-3" aria-hidden />
                            ))}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr
                    key={r.action.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a,button")) return;
                      router.push(
                        `/feststellungen/${r.action.source.id}#massnahmen`,
                      );
                    }}
                    className="cursor-pointer border-b border-border align-middle last:border-0 hover:bg-muted/40"
                  >
                    {actionColumns.map((c) => (
                      <td
                        key={c.key}
                        className="whitespace-nowrap px-1.5 py-2.5 first:pl-3"
                      >
                        {c.cell(r, names)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </section>
  );
}
