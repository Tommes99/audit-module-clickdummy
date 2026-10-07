"use client";

import { useMemo } from "react";
import { GuardHint } from "@/components/shared/guard-hint";
import { TransitionButton } from "@/components/shared/transition-button";
import { useAppStore } from "@/store/app-store";
import { useCan } from "@/hooks/use-can";
import { checkEffectivenessApproval } from "@/domain/rules";
import type { EffectivenessCheck } from "@/types/domain";

/** Vier-Augen-Prinzip: Bestätigung durch eine andere Person als die Durchführende */
export function DetailEffectivenessApprove({ check }: { check: EffectivenessCheck }) {
  const session = useAppStore((s) => s.session);
  const approveEffectivenessCheck = useAppStore((s) => s.approveEffectivenessCheck);
  const can = useCan();
  const permission = can("verify_effectiveness");
  const guard = useMemo(() => checkEffectivenessApproval(check, session.personId), [check, session.personId]);

  return (
    <div className="max-w-md space-y-2">
      <TransitionButton
        label="Bestätigung durch zweite Person"
        run={() => approveEffectivenessCheck(check.id)}
        successMessage="Wirksamkeitsprüfung bestätigt"
        blockers={guard.blockers}
        deniedReason={permission.allowed ? undefined : permission.reason}
      />
      {permission.allowed && <GuardHint blockers={guard.blockers} />}
    </div>
  );
}
