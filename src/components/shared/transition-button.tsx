"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { GuardedButton } from "@/components/shared/guarded-button";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import { notify } from "@/lib/notify";
import type { ActionResult } from "@/store/helpers";

interface TransitionButtonProps extends Omit<ComponentProps<typeof GuardedButton>, "onClick" | "children"> {
  label: ReactNode;
  /** Führt die Store-Action aus. Bekommt die Begründung, wenn ein Dialog verlangt wird. */
  run: (reason?: string) => ActionResult;
  /** Meldung bei Erfolg, gleiche Bezeichnung wie der Button ("Bericht freigeben" -> "Bericht freigegeben") */
  successMessage?: string;
  /** Gesetzt: Statuswechsel mit Begründungspflicht, öffnet vorher den Dialog */
  reasonDialog?: { title: string; description?: string; fieldLabel?: string; confirmLabel?: string; initialReason?: string };
  onDone?: (result: ActionResult) => void;
}

/**
 * Button für einen Statuswechsel. Zeigt Blocker als Tooltip (über GuardedButton),
 * öffnet bei Begründungspflicht den ReasonDialog und meldet das Ergebnis per Toast.
 */
export function TransitionButton({ label, run, successMessage, reasonDialog, onDone, ...props }: TransitionButtonProps) {
  const [open, setOpen] = useState(false);

  const execute = (reason?: string): boolean => {
    const result = run(reason);
    const ok = notify(result, successMessage);
    if (ok) onDone?.(result);
    return ok;
  };

  return (
    <>
      <GuardedButton {...props} onClick={() => (reasonDialog ? setOpen(true) : execute())}>
        {label}
      </GuardedButton>
      {reasonDialog && (
        <ReasonDialog
          open={open}
          onOpenChange={setOpen}
          title={reasonDialog.title}
          description={reasonDialog.description}
          fieldLabel={reasonDialog.fieldLabel}
          initialReason={reasonDialog.initialReason}
          confirmLabel={reasonDialog.confirmLabel ?? (typeof label === "string" ? label : "Bestätigen")}
          onConfirm={(reason) => execute(reason)}
        />
      )}
    </>
  );
}
