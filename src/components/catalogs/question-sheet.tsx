"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { SheetField } from "@/components/finding/finding-sheet-section";
import { RequirementPicker } from "@/components/catalogs/requirement-picker";
import { notify } from "@/lib/notify";
import { checkCatalogQuestion } from "@/domain/rules";
import { useAppStore } from "@/store/app-store";
import type { CatalogQuestion, QuestionCatalog } from "@/types/domain";

interface QuestionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: QuestionCatalog;
  /** Gesetzt: Frage bearbeiten. Leer: neue Frage ergänzen. */
  question?: CatalogQuestion;
}

/** Frage im Entwurf ergänzen oder ändern. Inhalt nur bei geöffnetem Sheet, damit das Formular beim Schließen zurückgesetzt wird. */
export function QuestionSheet({ open, onOpenChange, catalog, question }: QuestionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-xl">
        {open && <QuestionForm catalog={catalog} question={question} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function QuestionForm({ catalog, question, onClose }: { catalog: QuestionCatalog; question?: CatalogQuestion; onClose: () => void }) {
  const requirements = useAppStore((s) => s.data.requirements);
  const save = useAppStore((s) => s.saveCatalogQuestion);
  const [text, setText] = useState(question?.text ?? "");
  const [guidance, setGuidance] = useState(question?.guidance ?? "");
  const [evidenceHint, setEvidenceHint] = useState(question?.evidenceHint ?? "");
  const [requirementIds, setRequirementIds] = useState(question?.requirementIds ?? []);
  const [touched, setTouched] = useState(false);

  const blockers = checkCatalogQuestion({ text, requirementIds }, catalog, requirements);
  const submit = () => {
    setTouched(true);
    if (blockers.length > 0) return;
    const result = save(catalog.id, question?.id ?? null, { text, guidance, evidenceHint, requirementIds });
    if (notify(result, question ? "Frage geändert" : "Frage ergänzt")) onClose();
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <SheetHeader className="border-b border-border p-5">
        <SheetTitle className="text-base">{question ? "Frage bearbeiten" : "Frage ergänzen"}</SheetTitle>
        <SheetDescription>
          Entwurf Version <span className="tnum">{catalog.version}</span>. Die Änderung wird erst mit der Freigabe der Version wirksam.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <SheetField id="cq-text" label="Frage" required error={touched && !text.trim() ? "Fragetext angeben." : undefined}>
          <Textarea id="cq-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        </SheetField>
        <SheetField
          id="cq-requirements"
          label="Anforderungen"
          required
          error={touched && requirementIds.length === 0 ? "Mindestens eine Anforderung zuordnen." : undefined}
        >
          <RequirementPicker standardIds={catalog.standardIds} value={requirementIds} onChange={setRequirementIds} />
        </SheetField>
        <SheetField id="cq-guidance" label="Hinweis für Auditor:innen">
          <Textarea id="cq-guidance" rows={2} value={guidance} onChange={(e) => setGuidance(e.target.value)} />
        </SheetField>
        <SheetField id="cq-evidence" label="Typische Nachweise">
          <Input id="cq-evidence" value={evidenceHint} onChange={(e) => setEvidenceHint(e.target.value)} />
        </SheetField>
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-popover p-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="submit">{question ? "Änderung speichern" : "Frage ergänzen"}</Button>
      </div>
    </form>
  );
}
