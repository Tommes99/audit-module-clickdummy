"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { useCan } from "@/hooks/use-can";
import { auditReports } from "@/store/selectors";
import { isReportImmutable } from "@/domain/rules";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { GuardHint } from "@/components/shared/guard-hint";
import { Panel } from "@/components/shared/panel";
import { AiBadge, ReportStatusBadge } from "@/components/shared/status-badge";
import { ReportActions, reportActionBlockers } from "@/components/report/report-actions";
import { ReportAppendix, ReportContent } from "@/components/report/report-content";
import { ReportCreate } from "@/components/report/report-create";
import { ReportDraftForm } from "@/components/report/report-draft-form";
import { ReportLockBox } from "@/components/report/report-lock-box";
import { VersionCompare } from "@/components/report/version-compare";
import { VersionTable } from "@/components/report/version-table";

/** Tab "Bericht": Zustand und Aktion oben, darunter Sperrhinweis, Versionen, Inhalt und Versionsvergleich */
export function ReportTab({ auditId }: { auditId: string }) {
  const data = useAppStore((s) => s.data);
  const can = useCan();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const audit = useMemo(() => data.audits.find((a) => a.id === auditId), [data.audits, auditId]);
  const reports = useMemo(() => auditReports(data, auditId), [data, auditId]);

  if (!audit) return <EmptyState>Audit nicht gefunden. Wählen Sie ein Audit aus der Übersicht.</EmptyState>;
  if (reports.length === 0) return <ReportCreate audit={audit} />;

  // Standard ist die aktuelle Version des Audits, sonst die neueste
  const report = reports.find((r) => r.id === chosenId) ?? reports.find((r) => r.id === audit.currentReportId) ?? reports[0];
  const locked = isReportImmutable(report);
  const editRight = can("edit_checklist", { audit });
  const blockers = reportActionBlockers(report, dirty);
  const select = (id: string) => {
    setChosenId(id);
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionTitle help="audit.report">Bericht</SectionTitle>
        <Panel className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[15px] font-semibold">
              <span className="tnum">{audit.number}</span>, Version <span className="tnum">{report.version}</span>
            </span>
            <ReportStatusBadge status={report.status} />
            {report.aiAssisted && <AiBadge />}
          </div>
          <ReportActions audit={audit} report={report} dirty={dirty} onVersionCreated={() => setChosenId(null)} />
        </Panel>
        <GuardHint blockers={blockers} />
        {locked && <ReportLockBox report={report} />}
      </div>

      {reports.length >= 2 && (
        <section aria-labelledby="rep-versions">
          <div id="rep-versions">
            <SectionTitle count={reports.length}>Berichtsversionen</SectionTitle>
          </div>
          <VersionTable reports={reports} selectedId={report.id} onSelect={select} />
        </section>
      )}

      <section aria-label={`Inhalt Version ${report.version}`} className="space-y-6">
        {report.status === "draft" ? (
          <ReportDraftForm key={report.id} report={report} deniedReason={editRight.allowed ? undefined : editRight.reason} onDirtyChange={setDirty} />
        ) : (
          <ReportContent report={report} />
        )}
        <ReportAppendix report={report} />
      </section>

      {reports.length >= 2 && <VersionCompare key={reports.map((r) => r.id).join("|")} reports={reports} />}
    </div>
  );
}
