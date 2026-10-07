import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/store/selectors";
import type { Site } from "@/types/domain";

/** Eine Farbe in festen Stufen (1, 2, 3 und mehr). Die Zahl steht immer in der Zelle, Nullwerte sind gedämpft. */
function heatClass(count: number): string {
  if (count === 0) return "text-muted-foreground/60";
  if (count >= 3) return "bg-primary font-semibold text-primary-foreground";
  if (count === 2) return "bg-primary/30 font-semibold text-foreground";
  return "bg-primary/12 font-semibold text-foreground";
}

/** Offene Abweichungen nach Norm und Standort als ruhige Heatmap, Spalte "Lieferant" nur bei vorhandenen Werten */
export function OpenNcTable({ stats, sites }: { stats: DashboardStats; sites: Site[] }) {
  const showSupplier = stats.openNcMatrix.some((r) => r.counts.some((c) => c.siteId === null && c.count > 0));
  const columns: { siteId: string | null; label: string }[] = [
    ...sites.map((s) => ({ siteId: s.id, label: s.name })),
    ...(showSupplier ? [{ siteId: null, label: "Lieferant" }] : []),
  ];

  return (
    <section aria-labelledby="dash-nc">
      <div id="dash-nc">
        <SectionTitle help="dashboard.openNc" count={stats.openNcTotal}>
          Offene Abweichungen nach Norm und Standort
        </SectionTitle>
      </div>
      <Panel padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-separate border-spacing-0 text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Norm</th>
                {columns.map((c) => (
                  <th key={c.label} scope="col" className="px-2 py-2 text-center font-medium">{c.label}</th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">Summe</th>
              </tr>
            </thead>
            <tbody>
              {stats.openNcMatrix.map((row) => (
                <tr key={row.standardId}>
                  <th scope="row" className="border-t border-border px-3 py-1.5 text-left font-medium">{row.code}</th>
                  {columns.map((c) => {
                    const count = row.counts.find((x) => x.siteId === c.siteId)?.count ?? 0;
                    return (
                      <td key={c.label} className="border-t border-border p-1">
                        <div
                          className={cn("tnum flex h-9 items-center justify-center rounded-md", heatClass(count))}
                          aria-label={`${row.code}, ${c.label}: ${count} offene Abweichungen`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                  <td className={cn("tnum border-t border-border px-3 py-1.5 text-right", row.total === 0 ? "text-muted-foreground/60" : "font-semibold")}>
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}
