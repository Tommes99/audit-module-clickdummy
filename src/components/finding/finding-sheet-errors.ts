import { requiresCapa } from "@/domain/rules";
import type { FieldErrors, FieldKey, FindingForm } from "./finding-sheet-types";

/** Fehler direkt am Feld, erst nachdem das Feld bedient wurde. Die Regeln selbst stehen in rules.ts (Übergang "Offen"). */
export function computeFieldErrors(form: FindingForm): FieldErrors {
  const capa = form.classification !== "" && requiresCapa(form.classification);
  const missing: Record<FieldKey, string | null> = {
    requirements: form.requirementIds.length === 0 ? "Mindestens eine Anforderung zuordnen." : null,
    process: form.processId ? null : "Prozess zuordnen.",
    title: form.title.trim() ? null : "Kurztitel angeben.",
    description: form.description.trim() ? null : "Beschreibung ergänzen.",
    classification: form.classification ? null : "Klassifizierung wählen.",
    owner: capa && !form.ownerId ? "Bei Abweichungen ist eine verantwortliche Person Pflicht." : null,
    due: capa && !form.dueDate ? "Bei Abweichungen ist eine Frist Pflicht." : null,
  };
  const errors: FieldErrors = {};
  (Object.keys(missing) as FieldKey[]).forEach((k) => {
    const message = missing[k];
    if (message && form.touched[k]) errors[k] = message;
  });
  return errors;
}
