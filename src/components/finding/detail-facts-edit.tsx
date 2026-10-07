"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/shared/native-select";
import { useAppStore } from "@/store/app-store";
import { notify } from "@/lib/notify";
import type { FindingPatch } from "@/store/commands/finding";
import type { Finding } from "@/types/domain";

/** Bearbeiten-Modus für Titel, Beschreibung, Verantwortliche:r und Frist. Blocker der Action erscheinen als Toast. */
export function DetailFactsEdit({ finding, onDone }: { finding: Finding; onDone: () => void }) {
  const persons = useAppStore((s) => s.data.persons);
  const updateFinding = useAppStore((s) => s.updateFinding);
  const [title, setTitle] = useState(finding.title);
  const [description, setDescription] = useState(finding.description);
  const [ownerId, setOwnerId] = useState(finding.ownerId ?? "");
  const [dueDate, setDueDate] = useState(finding.dueDate ?? "");

  const save = () => {
    const patch: FindingPatch = {
      title: title.trim(),
      description: description.trim(),
      ownerId: ownerId || undefined,
      dueDate: dueDate || undefined,
    };
    if (notify(updateFinding(finding.id, patch), "Feststellung geändert")) onDone();
  };

  return (
    <form
      className="max-w-2xl space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Titel</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Beschreibung</Label>
        <Textarea id="edit-description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-owner">Verantwortliche:r</Label>
          <NativeSelect
            id="edit-owner"
            value={ownerId}
            onChange={setOwnerId}
            placeholder="Bitte wählen"
            options={persons.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-due">Frist</Label>
          <Input id="edit-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="tnum" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!title.trim()}>
          Änderungen speichern
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
