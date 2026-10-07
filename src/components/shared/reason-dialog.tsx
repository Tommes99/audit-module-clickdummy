"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fieldLabel?: string;
  confirmLabel: string;
  initialReason?: string;
  /** Wird mit der getrimmten Begründung aufgerufen. Gibt true zurück, wenn der Dialog schließen darf. */
  onConfirm: (reason: string) => boolean | void;
}

/** Dialog mit Pflichtfeld für Übergänge mit Begründungspflicht (transitionsRequiringReason) */
export function ReasonDialog(props: ReasonDialogProps) {
  // Beim Schließen wird der Inhalt verworfen, damit der nächste Aufruf leer startet
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>{props.open && <ReasonForm {...props} />}</DialogContent>
    </Dialog>
  );
}

function ReasonForm({ title, description, fieldLabel = "Begründung", confirmLabel, initialReason = "", onConfirm, onOpenChange }: ReasonDialogProps) {
  const [reason, setReason] = useState(initialReason);
  const submit = () => {
    const closeIt = onConfirm(reason.trim());
    if (closeIt !== false) onOpenChange(false);
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="reason-field">{fieldLabel} (Pflichtfeld)</Label>
        <Textarea id="reason-field" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} autoFocus />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Abbrechen
        </Button>
        <Button onClick={submit} disabled={reason.trim().length === 0}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
