import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/store/selectors";

interface Kpi {
  key: string;
  label: string;
  value: string;
  href: string;
  /** Statusfarbe nur, wenn die Zahl eine Warnung bedeutet */
  tone?: "danger" | "warning";
  note?: string;
}

/** Kennzahlen-Kopfzeile: Zahl groß, Beschriftung klein, jede Kachel führt zur passenden Liste */
export function KpiStrip({ stats }: { stats: DashboardStats }) {
  const p = stats.programme;
  const kpis: Kpi[] = [
    { key: "nc", label: "Offene Abweichungen", value: String(stats.openNcTotal), href: "/feststellungen?filter=open_nc" },
    { key: "overdue", label: "Überfällige Maßnahmen", value: String(stats.actions.overdue), href: "/massnahmen?due=overdue", tone: stats.actions.overdue > 0 ? "danger" : undefined },
    { key: "soon", label: "Bald fällige Maßnahmen", value: String(stats.actions.dueSoon), href: "/massnahmen?due=due_soon", tone: stats.actions.dueSoon > 0 ? "warning" : undefined },
    {
      key: "eff",
      label: "Offene Wirksamkeitsprüfungen",
      value: String(stats.effectiveness.open),
      href: "/feststellungen?filter=effectiveness",
      note: stats.effectiveness.overdue > 0 ? `${stats.effectiveness.overdue} überfällig` : undefined,
    },
    { key: "prog", label: "Programmfortschritt", value: `${p.done} von ${p.total}`, href: "/programm", note: "Audits freigegeben oder abgeschlossen" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.key} className="min-w-0">
            <Link
              href={k.href}
              className="group block h-full rounded-lg border border-border bg-card px-4 py-3.5 outline-none transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "tnum block text-[28px] font-semibold leading-none tracking-tight",
                  k.tone === "danger" && "text-danger-ink",
                  k.tone === "warning" && "text-warning-ink",
                )}
              >
                {k.value}
              </span>
              <span className="mt-2 block text-[13px] text-muted-foreground group-hover:text-foreground">{k.label}</span>
              {k.note && <span className="mt-0.5 block text-xs text-muted-foreground">{k.note}</span>}
            </Link>
          </li>
        ))}
    </ul>
  );
}
