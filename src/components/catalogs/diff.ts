import { compareCatalogs } from "@/store/selectors";
import type { CatalogQuestion, QuestionCatalog } from "@/types/domain";

export interface ChangedQuestion {
  before: CatalogQuestion;
  after: CatalogQuestion;
  /** Was sich geändert hat, als Text für die Anzeige */
  what: string[];
}

export interface QuestionDiff {
  added: CatalogQuestion[];
  changed: ChangedQuestion[];
  removed: CatalogQuestion[];
  unchanged: number;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * Darstellung des Versionsvergleichs, aufbauend auf compareCatalogs (Vergleich über den Fragetext).
 * Eine entfernte und eine hinzugefügte Frage mit gleichen Anforderungen gelten als geänderter Wortlaut.
 * Gleicher Wortlaut mit anderem Hinweis, anderen Nachweisen oder Anforderungen gilt ebenfalls als geändert.
 */
export function diffQuestions(older: QuestionCatalog, newer: QuestionCatalog): QuestionDiff {
  const base = compareCatalogs(older, newer);
  const added = [...base.added];
  const removed = [...base.removed];
  const changed: ChangedQuestion[] = [];

  for (const r of [...removed]) {
    const idx = added.findIndex((a) => sameSet(a.requirementIds, r.requirementIds));
    if (idx < 0) continue;
    changed.push({ before: r, after: added[idx], what: ["Wortlaut"] });
    added.splice(idx, 1);
    removed.splice(removed.indexOf(r), 1);
  }

  let unchanged = 0;
  for (const q of base.unchanged) {
    const prev = older.questions.find((o) => o.text === q.text);
    const what: string[] = [];
    if (prev && !sameSet(prev.requirementIds, q.requirementIds)) what.push("Anforderungen");
    if (prev && (prev.guidance ?? "") !== (q.guidance ?? "")) what.push("Hinweis");
    if (prev && (prev.evidenceHint ?? "") !== (q.evidenceHint ?? "")) what.push("Typische Nachweise");
    if (prev && what.length > 0) changed.push({ before: prev, after: q, what });
    else unchanged += 1;
  }
  return { added, changed, removed, unchanged };
}
