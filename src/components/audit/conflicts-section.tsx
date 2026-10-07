"use client";

import { useMemo } from "react";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { SectionTitle } from "@/components/shared/page-header";
import { TransitionButton } from "@/components/shared/transition-button";
import { isTeamEditable } from "@/components/audit/transitions";
import { useCan } from "@/hooks/use-can";
import { conflictStatusLabels, formatDate } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";
import { auditOverview, personName } from "@/store/selectors";
import type { Audit } from "@/types/domain";

/** Unparteilichkeit und Qualifikation: Konflikte blockieren, Qualifikationslücken warnen nur */
export function ConflictsSection({ audit }: { audit: Audit }) {
  const data = useAppStore((s) => s.data);
  const overrideWarning = useAppStore((s) => s.overrideWarning);
  const can = useCan();
  const overview = useMemo(() => auditOverview(data, audit), [data, audit]);
  const permission = can("plan_audit");
  const editable = isTeamEditable(audit.status);

  const open = overview.conflicts.filter((c) => !c.overridden);
  const overridden = overview.conflicts.filter((c) => c.overridden);

  /** Kurzform: Person und Grund. Der volle Guard-Text steht einmalig im Kopf der Seite. */
  const shortReason = (c: (typeof open)[number]) => {
    const process = c.processId ? data.processes.find((p) => p.id === c.processId)?.name : undefined;
    return `${personName(data, c.auditorId)}: ${process ? `verantwortet "${process}"` : "ist zugleich Auditee"}`;
  };

  return (
    <section aria-labelledby="sec-conflicts">
      <div id="sec-conflicts">
        <SectionTitle help="audit.impartiality" count={open.length > 0 ? open.length : undefined}>
          Unparteilichkeit
        </SectionTitle>
      </div>
      {open.length === 0 && overridden.length === 0 ? (
        <Panel className="py-2.5 text-sm text-muted-foreground">Keine Konflikte im Auditteam</Panel>
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-border text-sm">
            {open.map((c) => (
              <li key={c.warningKey} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2">
                <span className="flex items-center gap-2">
                  <StatusBadge {...conflictStatusLabels.open} />
                  {shortReason(c)}
                </span>
                <TransitionButton
                  label="Warnung übersteuern"
                  size="sm"
                  variant="outline"
                  run={(reason) => overrideWarning(audit.id, c.warningKey, reason ?? "")}
                  successMessage="Warnung übersteuert"
                  blockers={editable ? [] : [audit.status === "cancelled" ? "Das Audit ist abgesagt." : "Nach dem Start der Durchführung nicht mehr änderbar."]}
                  deniedReason={permission.allowed ? undefined : permission.reason}
                  reasonDialog={{
                    title: "Warnung übersteuern",
                    description: `${c.message} Die Begründung wird im Verlauf protokolliert.`,
                    confirmLabel: "Warnung übersteuern",
                  }}
                />
              </li>
            ))}
            {overridden.map((c) => {
              const o = audit.warningOverrides.find((w) => w.warningKey === c.warningKey);
              return (
                <li key={c.warningKey} className="space-y-0.5 px-4 py-2">
                  <p className="flex items-center gap-2">
                    <StatusBadge {...conflictStatusLabels.overridden} />
                    {shortReason(c)}
                  </p>
                  {o && (
                    <p className="text-xs text-muted-foreground">
                      Von {personName(data, o.overriddenById)} am <span className="tnum">{formatDate(o.overriddenAt)}</span>, Begründung: {o.reason}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </section>
  );
}
