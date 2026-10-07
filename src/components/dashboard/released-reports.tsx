import Link from "next/link";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { ReportStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/domain/labels";
import type { AuditReport, SeedData } from "@/types/domain";

/** Letzte fünf freigegebene Berichte mit Link auf den Berichtstab des Audits */
export function ReleasedReports({ data }: { data: SeedData }) {
  const reports: AuditReport[] = data.reports
    .filter((r) => r.status === "released")
    .sort((a, b) => (b.releasedAt ?? "").localeCompare(a.releasedAt ?? ""))
    .slice(0, 5);

  return (
    <section aria-labelledby="dash-reports" className="space-y-3">
      <div id="dash-reports">
        <SectionTitle count={reports.length}>Freigegebene Berichte</SectionTitle>
      </div>
      {reports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input px-4 py-4 text-center text-sm text-muted-foreground">
          Noch keine freigegebenen Berichte. Berichte erscheinen hier, sobald ein Audit freigegeben wurde.
        </p>
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-border">
            {reports.map((r) => {
              const audit = data.audits.find((a) => a.id === r.auditId);
              return (
                <li key={r.id} className="space-y-1 px-3 py-2.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/audits/${r.auditId}?tab=bericht`} className="min-w-0 text-primary hover:underline">
                      <span className="tnum font-medium">{audit?.number}</span> {audit?.title}
                    </Link>
                    <ReportStatusBadge status={r.status} />
                  </div>
                  <p className="tnum text-xs text-muted-foreground">
                    Version {r.version}
                    {r.releasedAt && <>, freigegeben am {formatDate(r.releasedAt)}</>}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </section>
  );
}
