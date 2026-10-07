"use client";

import { useMemo, useState } from "react";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { GuardedButton } from "@/components/shared/guarded-button";
import { NativeSelect } from "@/components/shared/native-select";
import { Label } from "@/components/ui/label";
import { useCan } from "@/hooks/use-can";
import { isAuditContentLocked, isThirdPartyAudit } from "@/domain/rules";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";
import type { Audit } from "@/types/domain";

/** Audit ohne Checkliste: Externe Audits nutzen die der Zertifizierungsstelle, sonst Erzeugen aus freigegebenem Katalog */
export function ChecklistCreate({ audit }: { audit: Audit }) {
  const data = useAppStore((s) => s.data);
  const createChecklist = useAppStore((s) => s.createChecklist);
  const can = useCan();
  const [catalogId, setCatalogId] = useState("");

  const catalogs = useMemo(
    () =>
      data.catalogs.filter(
        (c) => c.status === "released" && audit.standardIds.every((s) => c.standardIds.includes(s)),
      ),
    [data.catalogs, audit.standardIds],
  );

  if (isThirdPartyAudit(audit)) {
    return <EmptyState>Externe Audits arbeiten mit der Checkliste der Zertifizierungsstelle.</EmptyState>;
  }
  if (isAuditContentLocked(audit)) {
    return <EmptyState>Das Audit ist gesperrt, es gibt keine Checkliste.</EmptyState>;
  }

  const planning = can("plan_audit");
  const permission = planning.allowed ? planning : can("edit_checklist", { audit });
  return (
    <section className="space-y-3">
      <SectionTitle help="audit.checklist">Checkliste</SectionTitle>
      <Panel className="space-y-4">
        <p className="text-sm">Noch keine Checkliste. Legen Sie sie aus einem Fragenkatalog an.</p>
        <div className="max-w-md space-y-1.5">
          <Label htmlFor="catalog-select">Fragenkatalog</Label>
          <NativeSelect
            id="catalog-select"
            value={catalogId}
            onChange={setCatalogId}
            placeholder="Bitte wählen"
            options={catalogs.map((c) => ({ value: c.id, label: `${c.name}, Version ${c.version}` }))}
            disabled={!permission.allowed}
          />
          {catalogs.length === 0 && (
            <p className="text-xs text-muted-foreground">Kein freigegebener Katalog deckt alle Normen dieses Audits ab.</p>
          )}
        </div>
        <GuardedButton
          type="button"
          deniedReason={permission.reason}
          blockers={!catalogId && permission.allowed ? ["Fragenkatalog wählen"] : []}
          onClick={() => notify(createChecklist(audit.id, catalogId), "Checkliste erzeugt")}
        >
          Checkliste erzeugen
        </GuardedButton>
      </Panel>
    </section>
  );
}
