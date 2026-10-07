"use client";

import { SectionTitle } from "@/components/shared/page-header";
import { EvidenceList } from "@/components/shared/evidence-list";
import { AttachEvidenceButton } from "@/components/shared/attach-evidence-button";
import { useFindingRights } from "@/components/finding/detail-rights";
import type { Finding } from "@/types/domain";

export function DetailEvidence({ finding }: { finding: Finding }) {
  const rights = useFindingRights(finding);
  return (
    <section id="nachweise" aria-label="Nachweise" className="scroll-mt-24">
      <SectionTitle
        help="finding.evidence"
        count={finding.evidenceIds.length}
        actions={
          // Geschlossene Feststellungen sind nicht änderbar (Guard in attachEvidence)
          finding.status === "closed" ? undefined : (
            <AttachEvidenceButton
              target={{ type: "finding", id: finding.id }}
              label="Anhängen"
              deniedReason={rights.evidence.allowed ? undefined : rights.evidence.reason}
            />
          )
        }
      >
        Nachweise
      </SectionTitle>
      <EvidenceList evidenceIds={finding.evidenceIds} emptyText={finding.status === "closed" ? "Kein Nachweis an der Feststellung." : "Noch kein Nachweis. Hängen Sie ein Foto, eine Datei oder einen Dokumentlink an."} />
    </section>
  );
}
