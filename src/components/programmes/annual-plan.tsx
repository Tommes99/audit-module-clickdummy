"use client";

import { Fragment, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { NativeSelect } from "@/components/shared/native-select";
import { PlanRow, PLAN_COLUMNS } from "@/components/programmes/plan-row";
import { useAppStore } from "@/store/app-store";
import { dashboardStats, personName, programmeAudits } from "@/store/selectors";
import { auditStatusLabels } from "@/domain/labels";
import { monthHeading, monthKey } from "@/components/programmes/month";
import type { Audit, AuditStatus } from "@/types/domain";

const SUPPLIER = "supplier";
const HEADERS = [
  "Nummer",
  "Titel",
  "Typ",
  "Standort",
  "Normen",
  "Zeitraum",
  "Status",
  "Risiko",
  "Leitung",
];

/** Jahresplan: Audits des Programms nach Planstart, gruppiert nach Monat, Risikobegründung aufklappbar */
export function AnnualPlan() {
  const data = useAppStore((s) => s.data);
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const stats = useMemo(() => dashboardStats(data), [data]);
  const all = useMemo(
    () => programmeAudits(data, data.programmes[0]?.id),
    [data],
  );
  const filtered = useMemo(
    () =>
      all.filter((a) => {
        if (site === SUPPLIER && a.siteId !== null) return false;
        if (site && site !== SUPPLIER && a.siteId !== site) return false;
        return !status || a.status === status;
      }),
    [all, site, status],
  );
  const groups = useMemo(() => {
    const map = new Map<string, Audit[]>();
    for (const a of filtered)
      map.set(monthKey(a.plannedStart), [
        ...(map.get(monthKey(a.plannedStart)) ?? []),
        a,
      ]);
    return [...map.entries()];
  }, [filtered]);

  const siteName = (a: Audit) =>
    a.siteId
      ? (data.sites.find((s) => s.id === a.siteId)?.name ?? "")
      : `Lieferant ${a.supplierName ?? "nicht benannt"}`;
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const { done, total, cancelled } = stats.programme;

  return (
    <section aria-label="Jahresplan" className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <NativeSelect
          aria-label="Standort"
          className="w-44"
          value={site}
          onChange={setSite}
          placeholder="Alle Standorte"
          options={[
            ...data.sites.map((s) => ({ value: s.id, label: s.name })),
            { value: SUPPLIER, label: "Lieferant" },
          ]}
        />
        <NativeSelect
          aria-label="Status"
          className="w-48"
          value={status}
          onChange={setStatus}
          placeholder="Alle Status"
          options={(Object.keys(auditStatusLabels) as AuditStatus[]).map(
            (s) => ({ value: s, label: auditStatusLabels[s].label }),
          )}
        />
        <p className="tnum text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} von {all.length} Audits
        </p>
        <div
          className="ml-auto flex min-w-60 flex-col gap-1"
          title={
            cancelled > 0
              ? `${cancelled} abgesagt, nicht mitgezählt`
              : undefined
          }
        >
          <p className="text-xs text-muted-foreground">
            <span className="tnum font-medium text-foreground">
              {done} von {total}
            </span>{" "}
            Audits abgeschlossen oder Bericht freigegeben
          </p>
          <div
            role="progressbar"
            aria-label="Programmfortschritt"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          Keine Audits für diese Filter. Wählen Sie einen anderen Standort oder
          Status.
        </EmptyState>
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th
                    scope="col"
                    className="w-10 px-2 py-2"
                    aria-label="Details"
                  />
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="whitespace-nowrap px-1.5 py-2 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(([key, audits]) => (
                  <Fragment key={key}>
                    <tr className="border-b border-border bg-muted/30">
                      <th
                        scope="colgroup"
                        colSpan={PLAN_COLUMNS}
                        className="px-3 py-1.5 text-left text-xs font-semibold"
                      >
                        {monthHeading(`${key}-01`)}
                        <span className="tnum ml-2 font-normal text-muted-foreground">
                          {audits.length}
                        </span>
                      </th>
                    </tr>
                    {audits.map((a) => (
                      <PlanRow
                        key={a.id}
                        audit={a}
                        siteName={siteName(a)}
                        leadName={personName(data, a.leadAuditorId)}
                        expanded={open.has(a.id)}
                        onToggle={() => toggle(a.id)}
                      />
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </section>
  );
}
