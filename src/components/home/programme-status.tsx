"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Panel } from "@/components/shared/panel";
import { SectionTitle } from "@/components/shared/page-header";
import { useAppStore } from "@/store/app-store";
import { dashboardStats } from "@/store/selectors";
import { cn } from "@/lib/utils";

/** Programmstatus als kompakte Kennzahlenzeile: jede Zahl führt zur passenden Seite */
export function ProgrammeStatus({ withDashboardLink = false }: { withDashboardLink?: boolean }) {
  const data = useAppStore((s) => s.data);
  const stats = useMemo(() => dashboardStats(data), [data]);
  const programme = data.programmes[0];
  const rows = [
    { label: "Audits im Programm", value: stats.programme.total, href: "/programm" },
    { label: "Abgeschlossen oder freigegeben", value: stats.programme.done, href: "/programm" },
    { label: "In Durchführung oder Bericht", value: stats.programme.inProgress, href: "/programm" },
    { label: "Geplant oder in Vorbereitung", value: stats.programme.planned, href: "/programm" },
    { label: "Offene Abweichungen", value: stats.openNcTotal, href: "/feststellungen?filter=open_nc", alert: false },
    { label: "Überfällige Maßnahmen", value: stats.actions.overdue, href: "/massnahmen?due=overdue", alert: stats.actions.overdue > 0 },
  ];
  return (
    <section aria-labelledby="programme-status">
      <div id="programme-status">
        <SectionTitle
          help="home.programme"
          actions={
            <Link href={withDashboardLink ? "/dashboard" : "/programm"} className="text-xs text-primary hover:underline">
              {withDashboardLink ? "Zum Dashboard" : "Zum Programm"}
            </Link>
          }
        >
          Programmstatus {programme?.title}
        </SectionTitle>
      </div>
      <Panel padded={false}>
        <ul className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {rows.map((r) => (
            <li key={r.label}>
              <Link
                href={r.href}
                className="block h-full px-3.5 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <span className={cn("tnum block text-2xl font-semibold leading-none", r.alert && "text-danger-ink")}>{r.value}</span>
                <span className="mt-1.5 block text-xs leading-snug text-muted-foreground">{r.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}
