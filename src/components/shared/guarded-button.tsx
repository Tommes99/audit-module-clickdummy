"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GuardedButtonProps extends ComponentProps<typeof Button> {
  /** Offene Guard-Blocker: Button bleibt sichtbar, ist deaktiviert, Tooltip nennt die Gründe */
  blockers?: string[];
  /** Fehlende Berechtigung, z. B. "Nur für Auditprogramm-Verantwortliche" */
  deniedReason?: string;
}

/** Button mit Begründung im Tooltip, wenn er nicht bedienbar ist (CLAUDE.md Abschnitt 6 und 9) */
export function GuardedButton({ blockers = [], deniedReason, disabled, children, ...props }: GuardedButtonProps) {
  const reasons = [...(deniedReason ? [deniedReason] : []), ...blockers];
  if (reasons.length === 0) {
    return (
      <Button disabled={disabled} {...props}>
        {children}
      </Button>
    );
  }
  return (
    <Tooltip>
      {/* Der Wrapper ist fokussierbar, damit der Tooltip auch bei deaktiviertem Button per Tastatur erreichbar ist */}
      <TooltipTrigger render={<span tabIndex={0} className="inline-flex rounded-lg" />}>
        <Button {...props} disabled tabIndex={-1}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <ul className="space-y-1">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
