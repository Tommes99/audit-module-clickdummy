"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { EntityChip } from "@/components/shared/entity-chip";
import { DetailFactsEdit } from "@/components/finding/detail-facts-edit";
import { useFindingRights } from "@/components/finding/detail-rights";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import { formatDateTime } from "@/domain/labels";
import type { Finding } from "@/types/domain";

/** Beschreibung und Stationen der Feststellung, bearbeitbar über einfachen Bearbeiten-Modus (updateFinding) */
export function DetailFacts({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const rights = useFindingRights(finding);
  const [editing, setEditing] = useState(false);
  const canEdit = finding.status !== "closed" && rights.canEditFields;

  const steps = [
    { label: "Erfasst", who: finding.raisedById, at: finding.raisedAt },
    ...(finding.acceptedById ? [{ label: "Angenommen", who: finding.acceptedById, at: finding.acceptedAt }] : []),
  ];

  return (
    <section id="details" aria-label="Beschreibung" className="scroll-mt-24">
      <SectionTitle
        actions={
          canEdit && !editing ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Bearbeiten
            </Button>
          ) : undefined
        }
      >
        Beschreibung
      </SectionTitle>
      <Panel className="space-y-3 text-sm">
        {editing ? (
          <DetailFactsEdit finding={finding} onDone={() => setEditing(false)} />
        ) : (
          <>
            <p className="whitespace-pre-line leading-relaxed">{finding.description || "Keine Beschreibung"}</p>
            {finding.rejectionReason && (
              <p>
                <span className="text-muted-foreground">Zurückweisungsgrund:</span> {finding.rejectionReason}
              </p>
            )}
            {finding.carriedOverFromFindingId && (
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Übernommen aus</span>
                <EntityChip kind="finding" id={finding.carriedOverFromFindingId} />
              </p>
            )}
            <p className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-2.5 text-xs text-muted-foreground">
              {steps.map((st) => (
                <span key={st.label}>
                  {st.label}: <span className="text-foreground">{personName(data, st.who)}</span>
                  {st.at && (
                    <>
                      , <span className="tnum">{formatDateTime(st.at)}</span>
                    </>
                  )}
                </span>
              ))}
            </p>
          </>
        )}
      </Panel>
    </section>
  );
}
