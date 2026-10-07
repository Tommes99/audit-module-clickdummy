import type {
  Audit,
  AuditReport,
  Checklist,
  ChecklistItem,
  Finding,
  ID,
  ISODateTime,
  QuestionCatalog,
} from "@/types/domain";
import { demoDigest, stableStringify } from "@/lib/hash";

/** Hash über den fachlichen Berichtsinhalt, gesetzt bei Freigabe (Seed und Live-Freigabe identisch) */
export function reportContentHash(
  r: Pick<AuditReport, "summary" | "conclusion" | "strengths" | "version">,
): string {
  return demoDigest(
    stableStringify({ summary: r.summary, conclusion: r.conclusion, strengths: r.strengths, version: r.version }),
  );
}

/**
 * Erzeugt den eingefrorenen Checklisten-Snapshot für ein Audit.
 * - Fragen werden kopiert, nicht referenziert: spätere Katalogänderungen wirken nicht zurück.
 * - Offene Feststellungen werden als carry_over-Fragen übernommen (ISO 19011 Kap. 6.3).
 */
export function createChecklistSnapshot(params: {
  checklistId: ID;
  audit: Audit;
  catalog: QuestionCatalog;
  carryOverFindings: Finding[];
  actorId: ID;
  now: ISODateTime;
}): Checklist {
  const { checklistId, audit, catalog, carryOverFindings, actorId, now } = params;
  const prefix = checklistId.replace(/^chk-/, "ci-");

  const catalogItems: ChecklistItem[] = catalog.questions.map((q, i) => ({
    id: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    origin: "catalog",
    sourceQuestionId: q.id,
    text: q.text,
    guidance: q.guidance,
    evidenceHint: q.evidenceHint,
    requirementIds: [...q.requirementIds],
    rating: null,
    notes: "",
    evidenceIds: [],
    findingIds: [],
  }));

  const carryOverItems: ChecklistItem[] = carryOverFindings.map((f, i) => ({
    id: `${prefix}-co-${String(i + 1).padStart(2, "0")}`,
    origin: "carry_over",
    sourceQuestionId: null,
    carriedOverFindingId: f.id,
    text: `Umsetzung und Wirksamkeit der Maßnahmen zu ${f.number} prüfen: ${f.title}`,
    requirementIds: [...f.requirementIds],
    rating: null,
    notes: "",
    evidenceIds: [],
    findingIds: [],
  }));

  return {
    id: checklistId,
    auditId: audit.id,
    catalogId: catalog.id,
    catalogVersion: catalog.version,
    snapshotAt: now,
    snapshotById: actorId,
    items: [...carryOverItems, ...catalogItems],
  };
}

/** Fachliche Nummern: A-2026-09, F-2026-007, M-2026-007 */
export function nextNumber(prefix: "A" | "F" | "M", year: number, existing: string[]): string {
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const max = existing.reduce((acc, n) => {
    const m = n.match(pattern);
    return m ? Math.max(acc, Number(m[1])) : acc;
  }, 0);
  const width = prefix === "A" ? 2 : 3;
  return `${prefix}-${year}-${String(max + 1).padStart(width, "0")}`;
}

/** Technische IDs für neu angelegte Objekte im Dummy */
export function newId(prefix: string): ID {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${rand}`;
}
