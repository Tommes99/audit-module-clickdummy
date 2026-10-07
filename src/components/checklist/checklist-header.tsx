"use client";

import { Panel } from "@/components/shared/panel";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";
import { personName, type ChecklistProgress } from "@/store/selectors";
import type { Checklist } from "@/types/domain";

/** Kopf der Checkliste: Fortschritt, Abweichungen und eine Zeile zum eingefrorenen Katalogstand */
export function ChecklistHeader({ checklist, progress }: { checklist: Checklist; progress: ChecklistProgress }) {
  const data = useAppStore((s) => s.data);
  const catalog = data.catalogs.find((c) => c.id === checklist.catalogId);
  const newer = data.catalogs
    .filter((c) => c.key === catalog?.key && c.status === "released" && c.version > checklist.catalogVersion)
    .sort((a, b) => b.version - a.version)[0];
  const percent = progress.total === 0 ? 0 : Math.round((progress.rated / progress.total) * 100);

  return (
    <Panel className="space-y-2.5 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm font-medium">
          <span className="tnum">{progress.rated}</span> von <span className="tnum">{progress.total}</span> Punkten bewertet
        </p>
        <p className="text-sm text-muted-foreground">
          Abweichungen: <span className="tnum font-semibold text-foreground">{progress.deviations}</span>
          <span className="mx-2 text-border" aria-hidden>
            |
          </span>
          Unbewertet: <span className="tnum font-semibold text-foreground">{progress.open}</span>
        </p>
      </div>
      <Progress value={percent} aria-label="Bewertungsfortschritt" />
      <p className="text-xs text-muted-foreground">
        Katalogstand: Version <span className="tnum">{checklist.catalogVersion}</span>
        {catalog ? ` (${catalog.name})` : ""}, eingefroren am <span className="tnum">{formatDate(checklist.snapshotAt)}</span> von{" "}
        {personName(data, checklist.snapshotById)}
        {newer && (
          <>
            . Neuere Katalogversion <span className="tnum">{newer.version}</span> ist freigegeben, diese Checkliste bleibt unverändert.
          </>
        )}
      </p>
    </Panel>
  );
}
