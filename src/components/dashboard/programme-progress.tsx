import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { AuditStatusBadge } from "@/components/shared/status-badge";
import { BarCell } from "@/components/dashboard/bar-cell";
import type { DashboardStats } from "@/store/selectors";
import type { Audit, AuditStatus } from "@/types/domain";

const STATUS_ORDER: AuditStatus[] = ["planned", "in_preparation", "in_progress", "reporting", "released", "closed", "cancelled"];

/** Programmfortschritt als gestapelter Balken mit Legende, darunter die Verteilung der Audits nach Status */
export function ProgrammeProgress({ stats, audits }: { stats: DashboardStats; audits: Audit[] }) {
  const p = stats.programme;
  const segments = [
    { label: "Abgeschlossen oder freigegeben", value: p.done, cls: "bg-success" },
    { label: "In Durchführung oder Bericht", value: p.inProgress, cls: "bg-primary" },
    { label: "Geplant oder in Vorbereitung", value: p.planned, cls: "bg-muted-foreground/30" },
  ];
  const counts = STATUS_ORDER.map((s) => ({ status: s, count: audits.filter((a) => a.status === s).length })).filter((x) => x.count > 0);
  const max = Math.max(1, ...counts.map((x) => x.count));

  return (
    <section aria-labelledby="dash-prog" className="space-y-3">
      <div id="dash-prog">
        <SectionTitle>Programmfortschritt</SectionTitle>
      </div>
      <Panel>
        <p className="text-sm">
          <span className="tnum text-xl font-semibold">{p.done} von {p.total}</span>
          <span className="ml-2 text-muted-foreground">Audits abgeschlossen oder freigegeben</span>
        </p>
        <div
          className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
        >
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.label} className={s.cls} style={{ width: `${p.total ? (s.value / p.total) * 100 : 0}%` }} />
            ))}
        </div>
        <ul className="mt-3 space-y-1 text-[13px]">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className={`inline-block size-2.5 rounded-sm ${s.cls}`} aria-hidden />
                {s.label}
              </span>
              <span className="tnum font-semibold">{s.value}</span>
            </li>
          ))}
        </ul>
        {p.cancelled > 0 && <p className="mt-2 text-xs text-muted-foreground">{p.cancelled} abgesagt, nicht mitgezählt</p>}
      </Panel>

      <h3 className="pt-2 text-[13px] font-semibold">Audits nach Status</h3>
      <Panel padded={false}>
        <ul className="divide-y divide-border">
          {counts.map(({ status, count }) => (
            <li key={status} className="grid grid-cols-[10rem_1fr] items-center gap-3 px-3 py-2">
              <span className="justify-self-start"><AuditStatusBadge status={status} /></span>
              <BarCell value={count} max={max} label={`${count} Audits`} />
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}
