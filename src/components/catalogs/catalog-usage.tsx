"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { EntityChip } from "@/components/shared/entity-chip";
import { AuditStatusBadge } from "@/components/shared/status-badge";
import { useAppStore } from "@/store/app-store";
import { auditsUsingCatalog } from "@/store/selectors";

/** Verwendung: Audits, deren Checkliste auf genau dieser Katalogversion beruht */
export function CatalogUsage({ catalogId }: { catalogId: string }) {
  const data = useAppStore((s) => s.data);
  const audits = useMemo(() => auditsUsingCatalog(data, catalogId), [data, catalogId]);
  if (audits.length === 0) {
    return <EmptyState>Noch kein Audit nutzt diese Version. Beim Anlegen einer Checkliste wird der Katalog als Snapshot kopiert.</EmptyState>;
  }
  return (
    <Panel padded={false}>
      <ul className="divide-y divide-border">
        {audits.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
            <EntityChip kind="audit" id={a.id} className="whitespace-nowrap" />
            <AuditStatusBadge status={a.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
