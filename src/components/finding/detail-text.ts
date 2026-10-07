import type { FindingClassification, FindingStatus } from "@/types/domain";

/** Erläuterungen laut Fachglossar (CLAUDE.md Abschnitt 4), keine Normtexte */
export const classificationHints: Record<FindingClassification, string> = {
  major_nc: "Anforderung nicht erfüllt, Systemwirksamkeit gefährdet.",
  minor_nc: "Anforderung teilweise nicht erfüllt, Einzelfall.",
  observation: "Hinweis ohne Abweichung, Risiko einer künftigen Abweichung.",
  opportunity: "Anregung, keine Pflicht zur Umsetzung.",
  positive: "Gute Praxis, wird im Bericht hervorgehoben.",
};

/** Nur in diesen Status ist eine Ursachenanalyse zu dokumentieren oder zu überarbeiten */
export const rcaEditableStatus: FindingStatus[] = ["accepted", "in_treatment"];

/** Demo: KI-Vorschläge gibt es nur für das vorbereitete Audit A-2026-09 */
export const AI_DEMO_AUDIT_NUMBER = "A-2026-09";
