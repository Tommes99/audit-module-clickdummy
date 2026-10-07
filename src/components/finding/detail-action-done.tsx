"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GuardedButton } from "@/components/shared/guarded-button";
import { useAppStore } from "@/store/app-store";
import { notify } from "@/lib/notify";
import type { CorrectiveAction } from "@/types/domain";

/** "Erledigen" mit optionaler Erledigungsnotiz, die als Begründung im Verlauf landet */
export function DetailActionDone({ action, deniedReason }: { action: CorrectiveAction; deniedReason?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <GuardedButton type="button" size="sm" deniedReason={deniedReason} onClick={() => setOpen(true)}>
        Erledigen
      </GuardedButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>{open && <DoneForm action={action} onClose={() => setOpen(false)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function DoneForm({ action, onClose }: { action: CorrectiveAction; onClose: () => void }) {
  const transitionAction = useAppStore((s) => s.transitionAction);
  const [note, setNote] = useState("");
  const submit = () => {
    if (notify(transitionAction(action.id, "done", note.trim() || undefined), "Maßnahme erledigt")) onClose();
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>Maßnahme erledigen</DialogTitle>
        <DialogDescription>
          {action.number} {action.title}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="done-note">Erledigungsnotiz (optional)</Label>
        <Textarea id="done-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button onClick={submit}>Erledigen</Button>
      </DialogFooter>
    </>
  );
}
