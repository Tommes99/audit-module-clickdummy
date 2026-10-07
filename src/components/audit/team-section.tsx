"use client";

import { useMemo, useState } from "react";
import { EntityChip, EntityChips } from "@/components/shared/entity-chip";
import { GuardedButton } from "@/components/shared/guarded-button";
import { NativeSelect } from "@/components/shared/native-select";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { TransitionButton } from "@/components/shared/transition-button";
import { isTeamEditable } from "@/components/audit/transitions";
import { useCan } from "@/hooks/use-can";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";
import { auditOverview } from "@/store/selectors";
import type { Audit } from "@/types/domain";

function AddAuditor({ audit, disabledBlockers, deniedReason }: { audit: Audit; disabledBlockers: string[]; deniedReason?: string }) {
  const persons = useAppStore((s) => s.data.persons);
  const standards = useAppStore((s) => s.data.standards);
  const assignAuditor = useAppStore((s) => s.assignAuditor);
  const [personId, setPersonId] = useState("");

  const options = useMemo(
    () =>
      persons
        .filter((p) => p.roles.includes("auditor") && !audit.auditorIds.includes(p.id))
        .map((p) => {
          const codes = p.auditorQualifications.map((q) => standards.find((s) => s.id === q)?.code).filter(Boolean);
          return { value: p.id, label: `${p.name}${codes.length ? ` (${codes.join(", ")})` : " (keine Qualifikation hinterlegt)"}` };
        }),
    [persons, standards, audit.auditorIds],
  );
  const locked = Boolean(deniedReason) || disabledBlockers.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="add-auditor" className="text-sm text-muted-foreground">
        Auditor:in hinzufügen
      </label>
      <div className="w-64 max-w-full">
        <NativeSelect id="add-auditor" value={personId} onChange={setPersonId} options={options} placeholder="Person wählen" disabled={locked} />
      </div>
      <GuardedButton
        size="sm"
        variant="outline"
        blockers={disabledBlockers}
        deniedReason={deniedReason}
        disabled={!personId}
        onClick={() => {
          if (notify(assignAuditor(audit.id, personId), "Auditor:in zugewiesen")) setPersonId("");
        }}
      >
        Zuweisen
      </GuardedButton>
    </div>
  );
}

/** Auditteam (Leitung, Auditor:innen mit Qualifikation) und Auditees */
export function TeamSection({ audit }: { audit: Audit }) {
  const data = useAppStore((s) => s.data);
  const removeAuditor = useAppStore((s) => s.removeAuditor);
  const can = useCan();
  const overview = useMemo(() => auditOverview(data, audit), [data, audit]);
  const permission = can("plan_audit");
  const lockedBlockers = isTeamEditable(audit.status) ? [] : [audit.status === "cancelled" ? "Das Audit ist abgesagt." : "Das Auditteam ist nach dem Start nicht mehr änderbar."];

  return (
    <section aria-labelledby="sec-team">
      <div id="sec-team">
        <SectionTitle help="audit.team" count={audit.auditorIds.length}>
          Auditteam
        </SectionTitle>
      </div>
      <Panel padded={false}>
        <ul className="divide-y divide-border">
          {audit.auditorIds.map((id) => {
            const person = data.persons.find((p) => p.id === id);
            if (!person) return null;
            const gap = overview.gaps.find((g) => g.auditorId === id);
            const conflict = overview.conflicts.some((c) => c.auditorId === id && !c.overridden);
            const isLead = id === audit.leadAuditorId;
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2.5">
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium">{person.name}</span>
                    <span className="text-muted-foreground">{person.jobTitle}</span>
                    {isLead && <StatusBadge label="Leitung" tone="info" />}
                    {conflict && <StatusBadge label="Interessenkonflikt" tone="danger" />}
                    {gap && <StatusBadge label="Qualifikationslücke" tone="warning" />}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <span className="mr-0.5">Qualifikation:</span>
                    {person.auditorQualifications.length === 0 ? (
                      <span>keine hinterlegt</span>
                    ) : (
                      person.auditorQualifications.map((q) => <EntityChip key={q} kind="standard" id={q} showTitle={false} />)
                    )}
                  </div>
                </div>
                {!isLead && (
                  <TransitionButton
                    label="Entfernen"
                    size="sm"
                    variant="outline"
                    run={() => removeAuditor(audit.id, id)}
                    successMessage="Auditor:in entfernt"
                    blockers={lockedBlockers}
                    deniedReason={permission.allowed ? undefined : permission.reason}
                  />
                )}
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border bg-muted/30 px-4 py-2.5">
          <AddAuditor audit={audit} disabledBlockers={lockedBlockers} deniedReason={permission.allowed ? undefined : permission.reason} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Auditees</span>
          <EntityChips kind="person" ids={audit.auditeeIds} showTitle={false} />
        </div>
      </Panel>
    </section>
  );
}
