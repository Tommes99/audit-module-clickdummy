import type { FindingClassification, FindingLinks, ID } from "@/types/domain";

/** Formularstand des Feststellungs-Sheets */
export interface FindingForm {
  /** Stichpunkte als Eingabe für "Mit KI formulieren" */
  statement: string;
  title: string;
  description: string;
  /** Leer = noch nicht gewählt, der Auditor entscheidet */
  classification: FindingClassification | "";
  requirementIds: ID[];
  processId: ID;
  ownerId: ID;
  ownerTouched: boolean;
  dueDate: string;
  links: FindingLinks;
  /** Übernommene KI-Vorschläge */
  aiKeys: string[];
  /** Felder, die schon bedient wurden: Fehler erscheinen erst dann am Feld */
  touched: Partial<Record<FieldKey, boolean>>;
}

export type FieldKey = "requirements" | "process" | "title" | "description" | "classification" | "owner" | "due";

/** Fehlertexte je Pflichtfeld, nur gesetzt wenn das Feld bedient wurde und noch leer ist */
export type FieldErrors = Partial<Record<FieldKey, string>>;

export type Touch = (key: FieldKey) => void;

export type FormPatch = (patch: Partial<FindingForm>) => void;

/** Schlüssel der vorbereiteten KI-Vorschläge, nur für das Audit A-2026-09 vorhanden */
export const AI_AUDIT_ID = "aud-2026-09";
export const AI_KEY_TEXT = "finding-gbu-halle3";
export const AI_KEY_LINKS = "links-gbu-halle3";
