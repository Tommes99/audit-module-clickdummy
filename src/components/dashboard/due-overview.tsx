"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { DueText } from "@/components/shared/due-text";
import { useAppStore } from "@/store/app-store";
import { actionRows, effectivenessDue, type DashboardStats } from "@/store/selectors";
import { cn } from "@/lib/utils";

interface DueEntry {
  key: string;
  kind: string;
  label: string;
  href: string;
  dueDate: string;
}

/** Zahl rechtsbündig, Farbe nur bei Überfälligkeit oder naher Frist, Nullwerte gedämpft */
function Num({ value, tone }: { value: number; tone?: "danger" | "warning" }) {
  return (
    <td
      className={cn(
        "tnum px-3 py-2 text-right",
        value === 0 && "text-muted-foreground/60",
        value > 0 && tone === "danger" && "font-semibold text-danger-ink",
        value > 0 && tone === "warning" && "font-semibold text-warning-ink",
      )}
    >
      {value}
    </td>
  );
}

/** Kennzahlen zu Fälligkeiten plus Liste der nächsten Termine */
export function DueOverview({ stats }: { stats: DashboardStats }) {
  const data = useAppStore((s) => s.data);
  const next = useMemo<DueEntry[]>(() => {
    const actions = actionRows(data)
      .filter((r) => r.action.status === "open" || r.action.status === "in_progress")
      .map((r) => ({
        key: r.action.id,
        kind: "Maßnahme",
        label: `${r.action.number} ${r.action.title}`,
        href: `/feststellungen/${r.action.source.id}#massnahmen`,
        dueDate: r.action.dueDate,
      }));
    const checks = effectivenessDue(data).flatMap(({ finding, check }) =>
      check?.plannedDate
        ? [{ key: finding.id, kind: "Wirksamkeitsprüfung", label: `${finding.number} ${finding.title}`, href: `/feststellungen/${finding.id}#wirksamkeit`, dueDate: check.plannedDate }]
        : [],
    );
    return [...actions, ...checks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 8);
  }, [data]);

  const rows = [
    { label: "Maßnahmen", ...stats.actions },
    { label: "Wirksamkeitsprüfungen", ...stats.effectiveness },
  ];

  return (
    <section aria-labelledby="dash-due" className="space-y-3">
      <div id="dash-due">
        <SectionTitle help="dashboard.due">Fälligkeiten</SectionTitle>
      </div>
      <Panel padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Art</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Überfällig</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Bald fällig</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Offen insgesamt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border last:border-0">
                  <th scope="row" className="px-3 py-2 text-left font-medium">{r.label}</th>
                  <Num value={r.overdue} tone="danger" />
                  <Num value={r.dueSoon} tone="warning" />
                  <Num value={r.open} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <h3 className="pt-2 text-[13px] font-semibold">Nächste Fälligkeiten</h3>
      {next.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input px-4 py-4 text-center text-sm text-muted-foreground">
          Keine offenen Fristen. Neue Maßnahmen und Wirksamkeitsprüfungen erscheinen hier.
        </p>
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-border">
            {next.map((e) => (
              <li key={`${e.kind}-${e.key}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="mr-2 text-xs text-muted-foreground">{e.kind}</span>
                  <Link href={e.href} className="text-primary hover:underline">
                    {e.label}
                  </Link>
                </span>
                <DueText dueDate={e.dueDate} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}
