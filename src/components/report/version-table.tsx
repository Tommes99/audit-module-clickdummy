"use client";

import { useAppStore } from "@/store/app-store";
import { formatDateTime } from "@/domain/labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Panel } from "@/components/shared/panel";
import { AiBadge, ReportStatusBadge } from "@/components/shared/status-badge";
import { HashValue } from "@/components/report/hash-value";
import { cn } from "@/lib/utils";
import type { AuditReport } from "@/types/domain";

interface VersionTableProps {
  reports: AuditReport[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Alle Berichtsversionen, ersetzte bleiben sichtbar. Zeile anklicken zeigt die Version darunter. */
export function VersionTable({ reports, selectedId, onSelect }: VersionTableProps) {
  const persons = useAppStore((s) => s.data.persons);
  const name = (id?: string) => persons.find((p) => p.id === id)?.name ?? "";

  return (
    <Panel padded={false}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead>Freigegeben</TableHead>
            <TableHead>Hash</TableHead>
            <TableHead>Änderungsgrund</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((r) => {
            const selected = r.id === selectedId;
            return (
              <TableRow
                key={r.id}
                data-state={selected ? "selected" : undefined}
                className={cn("cursor-pointer", selected && "bg-muted")}
                onClick={() => onSelect(r.id)}
              >
                <TableCell>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className="min-h-9 font-medium text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(r.id);
                    }}
                  >
                    Version <span className="tnum">{r.version}</span>
                  </button>
                  {selected && <span className="ml-2 text-xs text-muted-foreground">angezeigt</span>}
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <ReportStatusBadge status={r.status} />
                    {r.aiAssisted && <AiBadge />}
                  </span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {name(r.createdById)}
                  <span className="tnum block text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {r.releasedAt ? (
                    <>
                      {name(r.releasedById)}
                      <span className="tnum block text-xs text-muted-foreground">{formatDateTime(r.releasedAt)}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Noch nicht freigegeben</span>
                  )}
                </TableCell>
                <TableCell>
                  <HashValue hash={r.contentHash} />
                </TableCell>
                <TableCell className="max-w-72 whitespace-normal">{r.version >= 2 ? r.changeReason ?? "" : <span className="text-muted-foreground">Erste Version</span>}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}
