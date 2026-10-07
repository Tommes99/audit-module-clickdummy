"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { EntityChip, EntityChips } from "@/components/shared/entity-chip";
import { FactList, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { Audit } from "@/types/domain";

/** Anforderungen einer Norm, standardmäßig zugeklappt mit Anzahl */
function RequirementGroup({ standardId, requirementIds }: { standardId: string; requirementIds: string[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="px-4 py-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex min-h-8 w-full items-center gap-2 rounded text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-90")} aria-hidden />
        <EntityChip kind="standard" id={standardId} showTitle={false} className="pointer-events-none" />
        <span className="tnum text-muted-foreground">{requirementIds.length} Anforderungen</span>
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-1 pb-1 pl-6 pt-1">
          {requirementIds.map((id) => (
            <EntityChip key={id} kind="requirement" id={id} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Ziele, Scope, Normen, Prozesse und Anforderungen je Norm (zugeklappt) */
export function ScopeSection({ audit }: { audit: Audit }) {
  const requirements = useAppStore((s) => s.data.requirements);
  const groups = useMemo(
    () =>
      audit.standardIds.map((standardId) => ({
        standardId,
        requirementIds: audit.requirementIds.filter((id) => requirements.find((r) => r.id === id)?.standardId === standardId),
      })),
    [audit.standardIds, audit.requirementIds, requirements],
  );

  return (
    <section aria-labelledby="sec-scope">
      <div id="sec-scope">
        <SectionTitle help="audit.scope">Ziele und Scope</SectionTitle>
      </div>
      <Panel padded={false}>
        <div className="p-4">
          <FactList
            items={[
              { label: "Ziele", value: audit.objectives },
              { label: "Scope", value: audit.scopeDescription },
              { label: "Normen", value: <EntityChips kind="standard" ids={audit.standardIds} showTitle={false} /> },
              { label: "Prozesse", value: <EntityChips kind="process" ids={audit.processIds} /> },
            ]}
          />
        </div>
        <div className="divide-y divide-border border-t border-border">
          <p className="bg-muted/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">Anforderungen im Scope</p>
          {groups.map((g) => (
            <RequirementGroup key={g.standardId} {...g} />
          ))}
        </div>
      </Panel>
    </section>
  );
}
