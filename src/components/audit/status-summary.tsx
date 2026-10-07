"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FactList, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { ReportStatusBadge } from "@/components/shared/status-badge";
import { findingClassificationLabels } from "@/domain/labels";
import { isThirdPartyAudit } from "@/domain/rules";
import { useAppStore } from "@/store/app-store";
import { auditChecklist, auditFindings, checklistProgress } from "@/store/selectors";
import type { Audit, FindingClassification } from "@/types/domain";

const order: FindingClassification[] = ["major_nc", "minor_nc", "observation", "opportunity", "positive"];

/** Kurzstatus: Checklistenfortschritt, Feststellungen nach Klassifizierung, aktueller Bericht */
export function StatusSummary({ audit }: { audit: Audit }) {
  const data = useAppStore((s) => s.data);
  const base = `/audits/${audit.id}`;
  const progress = useMemo(() => checklistProgress(auditChecklist(data, audit)), [data, audit]);
  const findings = useMemo(() => auditFindings(data, audit.id), [data, audit.id]);
  const report = data.reports.find((r) => r.id === audit.currentReportId);
  const link = "text-primary hover:underline underline-offset-2";

  const checklist = !audit.checklistId ? (
    isThirdPartyAudit(audit) ? (
      "Externe Audits arbeiten mit der Checkliste der Zertifizierungsstelle"
    ) : (
      <span>
        Noch keine Checkliste.{" "}
        <Link href={`${base}?tab=checkliste`} scroll={false} className={link}>
          Zur Checkliste
        </Link>
      </span>
    )
  ) : (
    <Link href={`${base}?tab=checkliste`} scroll={false} className={link}>
      <span className="tnum">
        {progress.rated} von {progress.total} bewertet, {progress.deviations} Abweichungen
      </span>
    </Link>
  );

  const counts = order
    .map((c) => ({ c, n: findings.filter((f) => f.classification === c).length }))
    .filter((x) => x.n > 0);

  return (
    <section aria-labelledby="sec-summary">
      <div id="sec-summary">
        <SectionTitle>Kurzstatus</SectionTitle>
      </div>
      <Panel>
        <FactList
          items={[
            { label: "Checkliste", value: checklist },
            {
              label: "Feststellungen",
              value:
                counts.length === 0 ? (
                  <span className="text-muted-foreground">Noch keine</span>
                ) : (
                  <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {counts.map(({ c, n }) => (
                      <li key={c}>
                        <Link href={`${base}?tab=feststellungen`} scroll={false} className={link}>
                          <span className="tnum">{n}</span> {findingClassificationLabels[c].label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ),
            },
            {
              label: "Bericht",
              value: report ? (
                <Link href={`${base}?tab=bericht`} scroll={false} className="inline-flex items-center gap-2">
                  <span className="tnum">Version {report.version}</span>
                  <ReportStatusBadge status={report.status} />
                </Link>
              ) : (
                <span className="text-muted-foreground">Noch kein Bericht</span>
              ),
            },
          ]}
        />
      </Panel>
    </section>
  );
}
