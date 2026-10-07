"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DueText } from "@/components/shared/due-text";
import { isFindingDueSettled } from "@/domain/rules";
import { EntityChip } from "@/components/shared/entity-chip";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { AiBadge, ClassificationBadge, FindingStatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/store/app-store";
import { auditFindings, personName } from "@/store/selectors";

/** Tab "Feststellungen": alle Feststellungen des Audits als Tabelle */
export function FindingsTab({ auditId }: { auditId: string }) {
  const data = useAppStore((s) => s.data);
  const findings = useMemo(() => auditFindings(data, auditId), [data, auditId]);

  return (
    <section aria-labelledby="sec-findings">
      <div id="sec-findings">
        <SectionTitle help="audit.findings" count={findings.length}>
          Feststellungen
        </SectionTitle>
      </div>
      {findings.length === 0 ? (
        <EmptyState
          action={
            <Link href={`/audits/${auditId}?tab=checkliste`} scroll={false} className={buttonVariants({ variant: "outline" })}>
              Zur Checkliste
            </Link>
          }
        >
          Noch keine Feststellungen. Legen Sie eine aus einem Checklistenpunkt an.
        </EmptyState>
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Klassifizierung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Prozess</TableHead>
                  <TableHead>Verantwortlich</TableHead>
                  <TableHead>Frist</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="tnum align-top font-medium">
                      <Link href={`/feststellungen/${f.id}`} className="text-primary hover:underline underline-offset-2">
                        {f.number}
                      </Link>
                    </TableCell>
                    <TableCell className="align-top">
                      <ClassificationBadge classification={f.classification} />
                    </TableCell>
                    <TableCell className="align-top">
                      <FindingStatusBadge status={f.status} />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <span className="mr-2">{f.title}</span>
                      {f.aiAssisted && <AiBadge />}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <EntityChip kind="process" id={f.processId} />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      {f.ownerId ? personName(data, f.ownerId) : <span className="text-muted-foreground">Nicht zugewiesen</span>}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <DueText dueDate={f.dueDate} done={isFindingDueSettled(f)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}
    </section>
  );
}
