"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { auditFindings } from "@/store/selectors";
import { findingClassificationLabels } from "@/domain/labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClassificationBadge, FindingStatusBadge } from "@/components/shared/status-badge";
import { EntityChips } from "@/components/shared/entity-chip";
import { EvidenceList } from "@/components/shared/evidence-list";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import type { AuditReport, FindingClassification } from "@/types/domain";

const classificationOrder = Object.keys(findingClassificationLabels) as FindingClassification[];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}

/** Fließtext in lesbarer Zeilenlänge */
function Prose({ text }: { text: string }) {
  return text ? (
    <p className="max-w-[72ch] text-[15px] leading-relaxed">{text}</p>
  ) : (
    <p className="text-sm text-muted-foreground">Noch nicht ausgefüllt.</p>
  );
}

/** Feststellungen des Audits mit Zählung je Klassifizierung (gilt für alle Berichtsversionen) */
function FindingsTable({ auditId }: { auditId: string }) {
  const data = useAppStore((s) => s.data);
  const findings = useMemo(() => auditFindings(data, auditId), [data, auditId]);
  const counts = useMemo(
    () => classificationOrder.map((c) => ({ c, n: findings.filter((f) => f.classification === c).length })).filter((x) => x.n > 0),
    [findings],
  );
  if (findings.length === 0) return <EmptyState>Keine Feststellungen in diesem Audit.</EmptyState>;
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {counts.map(({ c, n }) => (
          <li key={c} className="flex items-center gap-1.5">
            <span className="tnum font-medium">{n}</span> {findingClassificationLabels[c].label}
          </li>
        ))}
      </ul>
      <Panel padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nummer</TableHead>
              <TableHead>Klassifizierung</TableHead>
              {/* Live-Stand, nicht Teil des freigegebenen Inhalts (contentHash) */}
              <TableHead>Aktueller Status</TableHead>
              <TableHead>Titel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <Link href={`/feststellungen/${f.id}`} className="tnum font-medium text-primary hover:underline">
                    {f.number}
                  </Link>
                </TableCell>
                <TableCell>
                  <ClassificationBadge classification={f.classification} />
                </TableCell>
                <TableCell>
                  <FindingStatusBadge status={f.status} />
                </TableCell>
                <TableCell className="whitespace-normal">{f.title}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

/** Lesende Darstellung einer Berichtsversion */
export function ReportContent({ report }: { report: AuditReport }) {
  return (
    <Panel className="space-y-6 p-5">
      <Block title="Zusammenfassung">
        <Prose text={report.summary} />
      </Block>
      <Block title="Gesamtbewertung">
        <Prose text={report.conclusion} />
      </Block>
      <Block title="Stärken">
        {report.strengths.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Stärken erfasst.</p>
        ) : (
          <ul className="max-w-[72ch] list-disc space-y-1 pl-5 text-[15px] leading-relaxed marker:text-muted-foreground">
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
      </Block>
    </Panel>
  );
}

/** Feststellungen, Verteiler und Anhänge */
export function ReportAppendix({ report }: { report: AuditReport }) {
  return (
    <div className="space-y-6">
      <Block title="Feststellungen des Audits">
        <FindingsTable auditId={report.auditId} />
      </Block>
      <Block title="Verteiler">
        <EntityChips kind="person" ids={report.distributionIds} showTitle={false} />
      </Block>
      <ReportAttachments report={report} />
    </div>
  );
}

function ReportAttachments({ report }: { report: AuditReport }) {
  if (report.attachmentEvidenceIds.length === 0) return null;
  return (
    <Block title="Anhänge">
      <EvidenceList evidenceIds={report.attachmentEvidenceIds} />
    </Block>
  );
}
