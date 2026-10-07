"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/shared/panel";
import { EntityChip } from "@/components/shared/entity-chip";
import {
  ClassificationBadge,
  FindingStatusBadge,
} from "@/components/shared/status-badge";
import { DueText } from "@/components/shared/due-text";
import { requiresCapa, isFindingDueSettled } from "@/domain/rules";
import type { Finding } from "@/types/domain";

const HEADERS = [
  "Nummer",
  "Titel",
  "Klassifizierung",
  "Status",
  "Audit",
  "Anforderung",
  "Standort",
  "Verantwortlich",
  "Frist",
];

interface Props {
  findings: Finding[];
  auditNumbers: Map<string, string>;
  siteName: (id: string | null) => string;
  personName: (id: string | undefined) => string;
}

/** Lesende Tabelle aller Feststellungen, die ganze Zeile führt zur Feststellung */
export function FindingsTable({
  findings,
  auditNumbers,
  siteName,
  personName,
}: Props) {
  const router = useRouter();
  return (
    <Panel padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] text-[13px]">
          <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap px-1.5 py-2.5 font-medium first:pl-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => (
              <tr
                key={f.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a,button")) return;
                  router.push(`/feststellungen/${f.id}`);
                }}
                className="cursor-pointer border-b border-border align-middle last:border-0 hover:bg-muted/40"
              >
                <td className="tnum whitespace-nowrap px-1.5 py-2.5 pl-3 font-medium">
                  <Link
                    href={`/feststellungen/${f.id}`}
                    className="text-primary hover:underline"
                  >
                    {f.number}
                  </Link>
                </td>
                <td className="min-w-32 max-w-44 px-1.5 py-2.5">{f.title}</td>
                <td className="px-1.5 py-2.5">
                  <ClassificationBadge classification={f.classification} />
                </td>
                <td className="px-1.5 py-2.5">
                  <FindingStatusBadge status={f.status} />
                </td>
                <td className="px-1.5 py-2.5">
                  <Link
                    href={`/audits/${f.auditId}`}
                    className="tnum whitespace-nowrap text-primary hover:underline"
                  >
                    {auditNumbers.get(f.auditId) ?? ""}
                  </Link>
                </td>
                <td className="px-1.5 py-2.5">
                  <span className="flex flex-col items-start gap-1">
                    {f.requirementIds.map((id) => (
                      <EntityChip
                        key={id}
                        kind="requirement"
                        id={id}
                        showTitle={false}
                        className="whitespace-nowrap"
                      />
                    ))}
                  </span>
                </td>
                <td className="px-1.5 py-2.5">{siteName(f.siteId)}</td>
                <td className="px-1.5 py-2.5">
                  {f.ownerId ? (
                    personName(f.ownerId)
                  ) : (
                    <span className="text-muted-foreground">
                      Nicht zugewiesen
                    </span>
                  )}
                </td>
                <td className="min-w-28 px-1.5 py-2.5 pr-3">
                  {requiresCapa(f.classification) || f.dueDate ? (
                    <DueText dueDate={f.dueDate} done={isFindingDueSettled(f)} />
                  ) : (
                    <span className="text-muted-foreground">Keine Frist</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
