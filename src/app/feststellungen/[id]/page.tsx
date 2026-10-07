"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { DetailHeader } from "@/components/finding/detail-header";
import { DetailFacts } from "@/components/finding/detail-facts";
import { DetailEvidence } from "@/components/finding/detail-evidence";
import { DetailRca } from "@/components/finding/detail-rca";
import { DetailActions } from "@/components/finding/detail-actions";
import { DetailEffectiveness } from "@/components/finding/detail-effectiveness";
import { DetailLinks } from "@/components/finding/detail-links";
import { DetailHistory } from "@/components/finding/detail-history";
import { EvidenceChain } from "@/components/shared/evidence-chain";
import { Breadcrumbs, EmptyState } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export default function FindingPage() {
  const { id } = useParams<{ id: string }>();
  const findings = useAppStore((s) => s.data.findings);
  const finding = useMemo(() => findings.find((f) => f.id === id), [findings, id]);

  if (!finding) {
    return (
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs items={[{ label: "Feststellungen", href: "/feststellungen" }, { label: "Feststellung nicht gefunden" }]} />
        <EmptyState
          action={
            <Link href="/feststellungen" className={buttonVariants({ variant: "outline" })}>
              Zu den Feststellungen
            </Link>
          }
        >
          Diese Feststellung gibt es nicht. Wählen Sie eine Feststellung aus der Liste oder über ein Audit.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <DetailHeader finding={finding} />
      <EvidenceChain finding={finding} />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-8">
          <DetailFacts finding={finding} />
          <DetailRca finding={finding} />
          <DetailActions finding={finding} />
          <DetailEffectiveness finding={finding} />
        </div>
        <aside aria-label="Verknüpfungen, Nachweise und Verlauf" className="min-w-0 space-y-8">
          <DetailLinks finding={finding} />
          <DetailEvidence finding={finding} />
          <DetailHistory finding={finding} />
        </aside>
      </div>
    </div>
  );
}
