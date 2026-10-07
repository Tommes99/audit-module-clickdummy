"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FindingSheetBody } from "./finding-sheet-body";

interface FindingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  checklistItemId: string;
}

/** Feststellung aus einem Checklistenpunkt anlegen. Inhalt nur bei geöffnetem Sheet, damit das Formular beim Schließen zurückgesetzt wird. */
export function FindingSheet({ open, onOpenChange, auditId, checklistItemId }: FindingSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-2xl">
        {open && <FindingSheetBody auditId={auditId} checklistItemId={checklistItemId} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}
