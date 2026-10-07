"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuardedButton } from "@/components/shared/guarded-button";
import { HelpHint } from "@/components/shared/help-hint";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";

interface MarkConformButtonProps {
  checklistId: string;
  openCount: number;
  disabledReasons: string[];
}

/** Demo-Abkürzung: bewertet alle unbewerteten Punkte als konform, mit Bestätigung und Kennzeichnung im Verlauf */
export function MarkConformButton({ checklistId, openCount, disabledReasons }: MarkConformButtonProps) {
  const markRemainingConform = useAppStore((s) => s.markRemainingConform);
  const [open, setOpen] = useState(false);

  const confirm = () => {
    if (notify(markRemainingConform(checklistId), `${openCount} Punkte als konform markiert`)) setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <GuardedButton
        type="button"
        variant="ghost"
        className="text-muted-foreground"
        blockers={openCount === 0 && disabledReasons.length === 0 ? ["Es gibt keine unbewerteten Punkte"] : disabledReasons}
        onClick={() => setOpen(true)}
      >
        Übrige als konform markieren
      </GuardedButton>
      <HelpHint topic="audit.markConform" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Übrige Punkte als konform markieren</DialogTitle>
            <DialogDescription>
              Demo-Abkürzung: <span className="tnum">{openCount}</span> unbewertete {openCount === 1 ? "Punkt wird" : "Punkte werden"} als
              konform bewertet. Die Aktion wird im Verlauf ausdrücklich als Demo-Abkürzung protokolliert. In der Praxis wird jeder
              Punkt einzeln bewertet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={confirm}>Als konform markieren</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
