import type { EntityType, ID, SeedData } from "@/types/domain";
import type { Session } from "@/domain/permissions";
import { aiSuggestions, type AiSuggestion } from "@/data/ai-suggestions";
import { emit, succeed, fail, type CommandOutput } from "@/store/helpers";

/** Objekt, auf das sich eine KI-Entscheidung bezieht */
export interface AiTarget {
  entityType: EntityType;
  entityId: ID;
  auditId?: ID;
  /** Bezeichnung für das Event, z. B. "F-2026-007" */
  label: string;
}

const contextLabels: Record<AiSuggestion["context"], string> = {
  finding_text: "Feststellungstext",
  root_cause: "Ursachenanalyse",
  report_draft: "Berichtsentwurf",
  risk_links: "Verknüpfungen zu Risiko und Kennzahl",
};

export const findSuggestion = (key: string): AiSuggestion | undefined => aiSuggestions.find((s) => s.key === key);

/** Schreibt das KI-Event. Wird auch von Aktionen genutzt, die den Inhalt direkt übernehmen. */
export function emitAiDecision(
  data: SeedData,
  session: Session,
  key: string,
  target: AiTarget,
  accepted: boolean,
): SeedData {
  const suggestion = findSuggestion(key);
  const what = suggestion ? contextLabels[suggestion.context] : "Vorschlag";
  return emit(data, session, {
    entityType: target.entityType,
    entityId: target.entityId,
    auditId: target.auditId,
    action: accepted ? "ai_suggestion_accepted" : "ai_suggestion_rejected",
    summary: accepted
      ? `KI-Vorschlag ${what} für ${target.label} geprüft und übernommen`
      : `KI-Vorschlag ${what} für ${target.label} verworfen`,
    aiGenerated: true,
  });
}

export function acceptAiSuggestion(data: SeedData, session: Session, key: string, target: AiTarget): CommandOutput {
  if (!findSuggestion(key)) return fail(data, ["KI-Vorschlag nicht gefunden."]);
  return succeed(emitAiDecision(data, session, key, target, true));
}

export function rejectAiSuggestion(data: SeedData, session: Session, key: string, target: AiTarget): CommandOutput {
  if (!findSuggestion(key)) return fail(data, ["KI-Vorschlag nicht gefunden."]);
  return succeed(emitAiDecision(data, session, key, target, false));
}
