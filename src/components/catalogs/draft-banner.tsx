"use client";

import { useMemo } from "react";
import { GuardHint } from "@/components/shared/guard-hint";
import { HelpHint } from "@/components/shared/help-hint";
import { useCan } from "@/hooks/use-can";
import { Panel } from "@/components/shared/panel";
import { useReleaseBlockers } from "@/components/catalogs/catalog-actions";
import { diffQuestions } from "@/components/catalogs/diff";
import type { QuestionCatalog } from "@/types/domain";

/** Entwurfsstatus: was sich gegenüber der Basis geändert hat und was der Freigabe noch im Weg steht */
export function DraftBanner({ catalog, versions }: { catalog: QuestionCatalog; versions: QuestionCatalog[] }) {
  const base = versions.find((v) => v.id === catalog.supersedesCatalogId);
  const blockers = useReleaseBlockers(catalog);
  const mayRelease = useCan()("manage_catalog").allowed;
  const diff = useMemo(() => (base ? diffQuestions(base, catalog) : undefined), [base, catalog]);

  return (
    <div className="mt-4 space-y-2">
      <Panel className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          Entwurf, noch nicht wirksam
          <HelpHint topic="catalogs.draft" />
        </span>
        {diff && base && (
          <span className="tnum text-muted-foreground">
            Gegenüber Version {base.version}: {diff.added.length} hinzugefügt, {diff.changed.length} geändert, {diff.removed.length} entfernt
          </span>
        )}
        <span className="flex items-center gap-2 text-muted-foreground sm:ml-auto">
          Laufende Audits bleiben unverändert
          <HelpHint topic="catalogs.snapshot" />
        </span>
      </Panel>
      {mayRelease && <GuardHint blockers={blockers} />}
    </div>
  );
}
