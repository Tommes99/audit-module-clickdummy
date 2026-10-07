"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { EntityChip, EntityChips } from "@/components/shared/entity-chip";
import { NativeSelect } from "@/components/shared/native-select";
import { AiSuggestionPanel, type AiOutput } from "@/components/shared/ai-suggestion-panel";
import { useFindingRights } from "@/components/finding/detail-rights";
import { AI_DEMO_AUDIT_NUMBER } from "@/components/finding/detail-text";
import { useAppStore } from "@/store/app-store";
import { itemNumbers } from "@/store/selectors";
import { notify } from "@/lib/notify";
import type { Finding } from "@/types/domain";

const LINKS_KEY = "links-gbu-halle3";

/** Verknüpfungen zu Risiken (GRC) und Kennzahlen (EHS) sowie Herkunft und Bezüge der Feststellung */
export function DetailLinks({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const linkFinding = useAppStore((s) => s.linkFinding);
  const rejectAiSuggestion = useAppStore((s) => s.rejectAiSuggestion);
  const rights = useFindingRights(finding);
  const [riskId, setRiskId] = useState("");
  const [kpiId, setKpiId] = useState("");

  const freeRisks = useMemo(() => data.risks.filter((r) => !finding.links.riskIds.includes(r.id)), [data.risks, finding.links.riskIds]);
  const freeKpis = useMemo(() => data.kpis.filter((k) => !finding.links.kpiIds.includes(k.id)), [data.kpis, finding.links.kpiIds]);

  const itemLink = useMemo(() => {
    if (!finding.checklistItemId) return undefined;
    const checklist = data.checklists.find((c) => c.items.some((i) => i.id === finding.checklistItemId));
    if (!checklist) return undefined;
    const no = itemNumbers(checklist).get(finding.checklistItemId);
    return { label: `Punkt ${no ?? ""}`.trim(), href: `/audits/${checklist.auditId}?tab=checkliste#${finding.checklistItemId}` };
  }, [data.checklists, finding.checklistItemId]);

  const canLink = finding.status !== "closed" && rights.canLink;
  const unlinked = finding.links.riskIds.length === 0 && finding.links.kpiIds.length === 0;
  const aiAvailable = canLink && unlinked && rights.audit?.number === AI_DEMO_AUDIT_NUMBER;
  const target = { entityType: "finding" as const, entityId: finding.id, auditId: finding.auditId, label: finding.number };

  const add = (kind: "risk" | "kpi") => {
    const ok = kind === "risk" ? notify(linkFinding(finding.id, { riskIds: [riskId] }), "Risiko verknüpft") : notify(linkFinding(finding.id, { kpiIds: [kpiId] }), "Kennzahl verknüpft");
    if (ok) (kind === "risk" ? setRiskId : setKpiId)("");
  };
  const acceptAi = (output: AiOutput) =>
    notify(linkFinding(finding.id, { riskIds: output.riskIds as string[], kpiIds: output.kpiIds as string[] }, LINKS_KEY), "Verknüpfungen übernommen");

  return (
    <section id="verknuepfungen" aria-label="Verknüpfungen" className="scroll-mt-24">
      <SectionTitle help="finding.links">Verknüpfungen</SectionTitle>
      <Panel className="space-y-3 text-sm">
        <Row label="Audit">
          <EntityChip kind="audit" id={finding.auditId} showTitle={false} />
        </Row>
        <Row label="Anforderungen">
          <EntityChips kind="requirement" ids={finding.requirementIds} />
        </Row>
        <Row label="Prozess und Standort">
          <span className="flex flex-wrap gap-1">
            <EntityChip kind="process" id={finding.processId} />
            {finding.siteId ? <EntityChip kind="site" id={finding.siteId} /> : <span className="text-muted-foreground">Lieferant</span>}
          </span>
        </Row>
        {itemLink && (
          <Row label="Checklistenpunkt">
            <Link href={itemLink.href} className="text-primary hover:underline">
              {itemLink.label}
            </Link>
          </Row>
        )}
        <Row label="Risiken">
          <EntityChips kind="risk" ids={finding.links.riskIds} />
        </Row>
        <Row label="Kennzahlen">
          <EntityChips kind="kpi" ids={finding.links.kpiIds} />
        </Row>
        {aiAvailable && (
          <AiSuggestionPanel
            suggestionKey={LINKS_KEY}
            triggerLabel="Verknüpfungen vorschlagen"
            onAccept={acceptAi}
            onReject={() => notify(rejectAiSuggestion(LINKS_KEY, target), "KI-Vorschlag verworfen")}
          />
        )}
        {canLink && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex gap-2">
              <NativeSelect
                aria-label="Risiko hinzufügen"
                value={riskId}
                onChange={setRiskId}
                placeholder="Risiko wählen"
                options={freeRisks.map((r) => ({ value: r.id, label: `${r.code} ${r.title}` }))}
              />
              <Button type="button" variant="outline" size="sm" disabled={!riskId} onClick={() => add("risk")}>
                Verknüpfen
              </Button>
            </div>
            <div className="flex gap-2">
              <NativeSelect
                aria-label="Kennzahl hinzufügen"
                value={kpiId}
                onChange={setKpiId}
                placeholder="Kennzahl wählen"
                options={freeKpis.map((k) => ({ value: k.id, label: `${k.code} ${k.name}` }))}
              />
              <Button type="button" variant="outline" size="sm" disabled={!kpiId} onClick={() => add("kpi")}>
                Verknüpfen
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 [&_.tnum]:shrink-0 [&_.tnum]:whitespace-nowrap">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
