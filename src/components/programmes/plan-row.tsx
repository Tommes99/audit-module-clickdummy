"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EntityChip } from "@/components/shared/entity-chip";
import { AuditStatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { auditTypeLabels, formatDate } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { Audit } from "@/types/domain";

export const PLAN_COLUMNS = 10;

/** Zeitraum kompakt: gleiches Jahr nur einmal nennen, z. B. "17.02. bis 18.02.2026" */
const period = (a: Audit) => {
  if (a.plannedStart === a.plannedEnd) return formatDate(a.plannedStart);
  const start = a.plannedStart.slice(0, 4) === a.plannedEnd.slice(0, 4) ? formatDate(a.plannedStart).slice(0, 6) : formatDate(a.plannedStart);
  return `${start} bis ${formatDate(a.plannedEnd)}`;
};

interface PlanRowProps {
  audit: Audit;
  siteName: string;
  leadName: string;
  expanded: boolean;
  onToggle: () => void;
}

/** Eine Auditzeile des Jahresplans, die Begründung der Risikoeinstufung klappt darunter auf */
export function PlanRow({ audit: a, siteName, leadName, expanded, onToggle }: PlanRowProps) {
  return (
    <Fragment>
      <tr className={cn("border-b border-border align-middle transition-colors hover:bg-muted/40", expanded && "bg-muted/30")}>
        <td className="w-10 pl-1 pr-0 py-0.5">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={`why-${a.id}`}
            aria-label={`Begründung der Risikoeinstufung für ${a.number} ${expanded ? "einklappen" : "aufklappen"}`}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} aria-hidden />
          </button>
        </td>
        <td className="tnum whitespace-nowrap px-1.5 py-2.5 font-medium">
          <Link href={`/audits/${a.id}`} className="text-primary hover:underline">
            {a.number}
          </Link>
        </td>
        <td className="min-w-44 px-1.5 py-2.5">{a.title}</td>
        <td className="px-1.5 py-2.5 text-muted-foreground">{auditTypeLabels[a.type]}</td>
        <td className="px-1.5 py-2.5">{siteName}</td>
        <td className="px-1.5 py-2.5">
          <span className="flex flex-col items-start gap-1">
            {a.standardIds.map((id) => (
              <EntityChip key={id} kind="standard" id={id} showTitle={false} className="whitespace-nowrap" />
            ))}
          </span>
        </td>
        <td className="tnum whitespace-nowrap px-1.5 py-2.5">{period(a)}</td>
        <td className="px-1.5 py-2.5">
          <AuditStatusBadge status={a.status} />
        </td>
        <td className="px-1.5 py-2.5">
          <RiskBadge level={a.planningRationale.riskLevel} />
        </td>
        <td className="px-1.5 py-2.5">{leadName}</td>
      </tr>
      {expanded && (
        <tr id={`why-${a.id}`} className="border-b border-border bg-muted/30">
          <td />
          <td colSpan={PLAN_COLUMNS - 1} className="px-2 pb-3 pt-1">
            <p className="text-xs font-semibold">Begründung der Risikoeinstufung</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {a.planningRationale.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
