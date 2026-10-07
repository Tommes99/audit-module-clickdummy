"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";

/** Notiz direkt am Punkt: speichert beim Verlassen des Feldes, nur wenn geändert */
export function ChecklistItemNotes({ itemId, notes, disabled }: { itemId: string; notes: string; disabled?: boolean }) {
  const setItemNotes = useAppStore((s) => s.setItemNotes);
  const [draft, setDraft] = useState(notes);
  const [synced, setSynced] = useState(notes);

  // Von außen geänderte Notiz (z. B. beim Bewerten) übernehmen, solange nicht gerade bearbeitet wird
  if (notes !== synced) {
    setSynced(notes);
    setDraft(notes);
  }

  const save = () => {
    if (draft === notes) return;
    if (!notify(setItemNotes(itemId, draft), "Notiz gespeichert")) setDraft(notes);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`notes-${itemId}`}>Notiz</Label>
      <Textarea
        id={`notes-${itemId}`}
        value={draft}
        disabled={disabled}
        rows={3}
        placeholder="Beobachtungen, Interviewaussagen, Stichpunkte"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
      />
    </div>
  );
}
