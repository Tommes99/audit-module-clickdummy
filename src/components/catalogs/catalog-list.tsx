"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { CatalogRows } from "@/components/catalogs/catalog-rows";
import { useAppStore } from "@/store/app-store";
import type { QuestionCatalog } from "@/types/domain";

/** Kataloge gruppiert nach stabilem Schlüssel: neueste Version prominent, ältere einklappbar */
export function CatalogList() {
  const data = useAppStore((s) => s.data);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const groups = useMemo(() => {
    const map = new Map<string, QuestionCatalog[]>();
    for (const c of data.catalogs) map.set(c.key, [...(map.get(c.key) ?? []), c]);
    return [...map.values()]
      .map((versions) => versions.sort((a, b) => b.version - a.version))
      .sort((a, b) => a[0].name.localeCompare(b[0].name, "de"));
  }, [data.catalogs]);

  if (groups.length === 0) return <EmptyState>Noch keine Fragenkataloge. Kataloge werden im Konzept über die Katalogverwaltung angelegt.</EmptyState>;

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <Panel padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[50rem] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Katalog</th>
              <th scope="col" className="px-3 py-2 font-medium">Normen</th>
              <th scope="col" className="px-3 py-2 font-medium">Version</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Fragen</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Genutzt von</th>
              <th scope="col" className="px-3 py-2 font-medium">Freigegeben</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((versions) => (
              <CatalogRows key={versions[0].key} versions={versions} expanded={open.has(versions[0].key)} onToggle={() => toggle(versions[0].key)} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
