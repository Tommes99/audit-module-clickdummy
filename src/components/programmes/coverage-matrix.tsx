"use client";

import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Check } from "lucide-react";
import { EmptyState } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { HelpHint } from "@/components/shared/help-hint";
import { NativeSelect } from "@/components/shared/native-select";
import { CoverageCellView, isGap } from "@/components/programmes/coverage-cell";
import {
  CoverageDetail,
  type CoverageSelection,
} from "@/components/programmes/coverage-detail";
import { useAppStore } from "@/store/app-store";
import { coverageMatrix, type CoverageRow } from "@/store/selectors";

const hasGap = (row: CoverageRow) => row.cells.some(isGap);
/** Lücke, für die bereits ein Audit geplant ist (dort wird sie geschlossen) */
const hasPlannedGap = (row: CoverageRow) =>
  row.cells.some((c) => isGap(c) && c.cell.nextPlannedOn);

/** Kompakte Legende: Zustand als Symbol und Text, nicht nur über Farbe */
function Legend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <AlertTriangle className="size-3.5 text-warning-ink" aria-hidden /> Nie
        auditiert
      </span>
      <span className="inline-flex items-center gap-1">
        <Check className="size-3.5 text-success" aria-hidden /> Auditiert
      </span>
      <span className="inline-flex items-center gap-1">
        <CalendarClock className="size-3.5 text-primary" aria-hidden /> Geplant
      </span>
      <HelpHint topic="programme.coverage" side="left" />
    </p>
  );
}

/** Abdeckungsmatrix: Normkapitel (Zeilen) × Standorte (Spalten), gruppiert nach Norm. Klick auf eine Zelle zeigt Details. */
export function CoverageMatrix() {
  const data = useAppStore((s) => s.data);
  const [standard, setStandard] = useState("");
  const [view, setView] = useState("");
  const [selected, setSelected] = useState<CoverageSelection | null>(null);

  const rows = useMemo(() => coverageMatrix(data), [data]);
  const gapCount = useMemo(() => rows.filter(hasGap).length, [rows]);
  const plannedGapCount = useMemo(
    () => rows.filter(hasPlannedGap).length,
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!standard || r.requirement.standardId === standard) &&
          (!view || (view === "gaps" ? hasGap(r) : hasPlannedGap(r))),
      ),
    [rows, standard, view],
  );
  const groups = useMemo(
    () =>
      data.standards
        .map((std) => ({
          std,
          rows: filtered.filter((r) => r.requirement.standardId === std.id),
        }))
        .filter((g) => g.rows.length > 0),
    [data.standards, filtered],
  );

  return (
    <section aria-label="Abdeckungsmatrix" className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <NativeSelect
          aria-label="Norm"
          className="w-48"
          value={standard}
          onChange={setStandard}
          placeholder="Alle Normen"
          options={data.standards.map((s) => ({ value: s.id, label: s.code }))}
        />
        <NativeSelect
          aria-label="Kapitel anzeigen"
          className="w-64"
          value={view}
          onChange={setView}
          placeholder="Alle Kapitel"
          options={[
            { value: "gaps", label: `Nur Lücken (${gapCount})` },
            {
              value: "planned",
              label: `Lücken mit geplantem Audit (${plannedGapCount})`,
            },
          ]}
        />
        <p className="tnum text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} von {rows.length} Normkapiteln
        </p>
        <div className="ml-auto">
          <Legend />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          Keine Normkapitel für diese Filter. Wählen Sie „Alle Kapitel“ oder
          eine andere Norm.
        </EmptyState>
      ) : (
        <Panel padded={false}>
          <div className="max-h-[72vh] overflow-auto">
            <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th
                    scope="col"
                    className="sticky top-0 z-10 w-[34%] border-b border-border bg-muted px-3 py-2 font-medium"
                  >
                    Normkapitel
                  </th>
                  {data.sites.map((s) => (
                    <th
                      key={s.id}
                      scope="col"
                      className="sticky top-0 z-10 border-b border-l border-border bg-muted px-3 py-2 font-medium"
                    >
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(({ std, rows: stdRows }) => (
                  <Fragment key={std.id}>
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={1 + data.sites.length}
                        className="border-b border-border bg-muted/40 px-3 py-1.5 text-left text-xs font-semibold"
                      >
                        {std.code}{" "}
                        <span className="font-normal text-muted-foreground">
                          {std.title}
                        </span>
                      </th>
                    </tr>
                    {stdRows.map((row) => (
                      <tr key={row.requirement.id} className="align-top">
                        <th
                          scope="row"
                          className="border-b border-border px-3 py-2.5 text-left font-normal"
                        >
                          <span className="tnum font-medium">
                            {row.requirement.clause}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {row.requirement.title}
                          </span>
                        </th>
                        {row.cells.map((c) => {
                          const siteName =
                            data.sites.find((s) => s.id === c.siteId)?.name ??
                            "";
                          return (
                            <td
                              key={c.siteId}
                              className={"border-b border-l border-border p-1"}
                            >
                              <CoverageCellView
                                cell={c}
                                label={`${row.standardCode} ${row.requirement.clause}, ${siteName}`}
                                onOpen={() => setSelected({ row, cell: c })}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      <CoverageDetail selection={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
