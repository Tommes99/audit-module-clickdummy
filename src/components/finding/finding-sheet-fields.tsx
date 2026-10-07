"use client";

import { AiSuggestionPanel } from "@/components/shared/ai-suggestion-panel";
import { HelpHint } from "@/components/shared/help-hint";
import { NativeSelect } from "@/components/shared/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { findingClassificationLabels } from "@/domain/labels";
import { requiresCapa } from "@/domain/rules";
import { useAppStore } from "@/store/app-store";
import type { FindingClassification } from "@/types/domain";
import { SheetField } from "./finding-sheet-section";
import { AI_AUDIT_ID, AI_KEY_TEXT, type FieldErrors, type FindingForm, type FormPatch, type Touch } from "./finding-sheet-types";

const classificationOptions = (Object.keys(findingClassificationLabels) as FindingClassification[]).map((k) => ({
  value: k,
  label: findingClassificationLabels[k].label,
}));

interface FieldsProps {
  auditId: string;
  auditNumber: string;
  form: FindingForm;
  patch: FormPatch;
  errors: FieldErrors;
  touch: Touch;
  onOwnerChange: (ownerId: string) => void;
}

/** Abschnitt 2: Stichpunkte mit KI-Formulierung, Titel und Beschreibung */
export function FindingSheetDescription({ auditId, auditNumber, form, patch, errors, touch }: Omit<FieldsProps, "onOwnerChange">) {
  const rejectAiSuggestion = useAppStore((s) => s.rejectAiSuggestion);
  const hasAi = auditId === AI_AUDIT_ID;

  const applyAi = (output: Record<string, string | string[]>) =>
    patch({
      title: String(output.title ?? ""),
      description: String(output.description ?? ""),
      aiKeys: form.aiKeys.includes(AI_KEY_TEXT) ? form.aiKeys : [...form.aiKeys, AI_KEY_TEXT],
    });

  return (
    <div className="space-y-4">
      <SheetField id="fs-statement" label="Stichpunkte">
        <Textarea
          id="fs-statement"
          rows={3}
          value={form.statement}
          onChange={(e) => patch({ statement: e.target.value })}
          placeholder="Was wurde festgestellt? Kurze Stichpunkte genügen."
        />
      </SheetField>
      {hasAi && (
        <AiSuggestionPanel
          suggestionKey={AI_KEY_TEXT}
          triggerLabel="Mit KI formulieren"
          accepted={form.aiKeys.includes(AI_KEY_TEXT)}
          onAccept={applyAi}
          onEdit={applyAi}
          onReject={() =>
            rejectAiSuggestion(AI_KEY_TEXT, { entityType: "audit", entityId: auditId, auditId, label: auditNumber })
          }
        />
      )}
      <SheetField id="fs-title" label="Kurztitel" required error={errors.title}>
        <Input
          id="fs-title"
          value={form.title}
          aria-invalid={Boolean(errors.title)}
          onChange={(e) => patch({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </SheetField>
      <SheetField id="fs-description" label="Beschreibung" required error={errors.description}>
        <Textarea
          id="fs-description"
          rows={6}
          value={form.description}
          aria-invalid={Boolean(errors.description)}
          onChange={(e) => patch({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </SheetField>
    </div>
  );
}

/** Abschnitt 3: Klassifizierung, Verantwortliche:r und Frist (bei Abweichungen Pflicht) */
export function FindingSheetClassification({ form, patch, errors, touch, onOwnerChange }: Omit<FieldsProps, "auditId" | "auditNumber">) {
  const persons = useAppStore((s) => s.data.persons);
  const capa = form.classification !== "" && requiresCapa(form.classification);

  return (
    <div className="space-y-4">
      <SheetField
        id="fs-classification"
        label="Klassifizierung"
        required
        error={errors.classification}
        help={<HelpHint topic="finding.classification" className="ml-0.5" />}
      >
        <NativeSelect
          id="fs-classification"
          value={form.classification}
          onChange={(v) => {
            touch("classification");
            patch({ classification: v as FindingClassification | "" });
          }}
          onBlur={() => touch("classification")}
          aria-invalid={Boolean(errors.classification)}
          placeholder="Bitte wählen"
          options={classificationOptions}
        />
      </SheetField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SheetField id="fs-owner" label="Verantwortliche:r" required={capa} error={errors.owner}>
          <NativeSelect
            id="fs-owner"
            value={form.ownerId}
            onChange={onOwnerChange}
            onBlur={() => touch("owner")}
            aria-invalid={Boolean(errors.owner)}
            placeholder="Bitte wählen"
            options={persons.map((p) => ({ value: p.id, label: p.name }))}
          />
        </SheetField>
        <SheetField id="fs-due" label="Frist" required={capa} error={errors.due}>
          <Input
            id="fs-due"
            type="date"
            className="tnum"
            value={form.dueDate}
            aria-invalid={Boolean(errors.due)}
            onChange={(e) => patch({ dueDate: e.target.value })}
            onBlur={() => touch("due")}
          />
        </SheetField>
      </div>
    </div>
  );
}
