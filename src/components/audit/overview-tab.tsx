"use client";

import { ConflictsSection } from "@/components/audit/conflicts-section";
import { PlanSection } from "@/components/audit/plan-section";
import { RiskSection } from "@/components/audit/risk-section";
import { ScopeSection } from "@/components/audit/scope-section";
import { StatusSummary } from "@/components/audit/status-summary";
import { TeamSection } from "@/components/audit/team-section";
import type { Audit } from "@/types/domain";

/** Tab "Übersicht und Plan": links Scope, Team und Unparteilichkeit, rechts Kurzstatus und Risiko, darunter der Auditplan */
export function OverviewTab({ audit }: { audit: Audit }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <ScopeSection audit={audit} />
          <TeamSection audit={audit} />
          <ConflictsSection audit={audit} />
        </div>
        <div className="space-y-8">
          <StatusSummary audit={audit} />
          <RiskSection audit={audit} />
        </div>
      </div>
      <PlanSection audit={audit} />
    </div>
  );
}
