"use client";

import { Breadcrumbs } from "@/components/shared/page-header";
import { AiBadge, ClassificationBadge, FindingStatusBadge } from "@/components/shared/status-badge";
import { HelpHint } from "@/components/shared/help-hint";
import { DueText } from "@/components/shared/due-text";
import { isFindingDueSettled } from "@/domain/rules";
import { ClosedNote, DetailTransitionButtons, DetailTransitionHints } from "@/components/finding/detail-transitions";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import type { Finding } from "@/types/domain";

/** Kopf: Brotkrumen, Titel, Eckdaten, nächste Aktion rechts, Blocker direkt darunter */
export function DetailHeader({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const audit = data.audits.find((a) => a.id === finding.auditId);
  return (
    <header className="mb-5 space-y-3">
      <div>
        <Breadcrumbs
          items={[
            { label: "Audits und Jahresplan", href: "/programm" },
            ...(audit ? [{ label: audit.number, href: `/audits/${audit.id}?tab=feststellungen` }] : []),
            { label: finding.number },
          ]}
        />
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-96 space-y-2">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
              <span className="tnum">{finding.number}</span> {finding.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ClassificationBadge classification={finding.classification} />
                <HelpHint topic="finding.classification" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FindingStatusBadge status={finding.status} />
                <HelpHint topic="finding.workflow" />
              </span>
              {finding.aiAssisted && <AiBadge />}
              <span>
                Verantwortlich: <span className="text-foreground">{finding.ownerId ? personName(data, finding.ownerId) : "Noch nicht festgelegt"}</span>
              </span>
              <span>
                Frist: <span className="text-foreground"><DueText dueDate={finding.dueDate} done={isFindingDueSettled(finding)} /></span>
              </span>
              <ClosedNote finding={finding} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DetailTransitionButtons finding={finding} />
          </div>
        </div>
      </div>
      <DetailTransitionHints finding={finding} />
    </header>
  );
}
