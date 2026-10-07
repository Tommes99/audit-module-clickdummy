import type { CatalogQuestion, FieldChange, ID, QuestionCatalog, SeedData } from "@/types/domain";
import type { Session } from "@/domain/permissions";
import { newId } from "@/domain/factories";
import {
  checkCatalogQuestion,
  checkCreateCatalogDraft,
  checkReleaseCatalog,
  nextCatalogVersion,
} from "@/domain/rules";
import { demoNow } from "@/domain/workflows";
import { emit, fail, replaceById, succeed, type CommandOutput } from "@/store/helpers";

export interface CatalogQuestionDraft {
  text: string;
  guidance?: string;
  evidenceHint?: string;
  requirementIds: ID[];
}

const label = (name: string, version: number) => `Fragenkatalog ${name} Version ${version}`;

/** Liefert den Entwurf oder den Fehlertext. Änderungen sind nur am Entwurf möglich. */
function draftOf(data: SeedData, catalogId: ID): QuestionCatalog | string {
  const catalog = data.catalogs.find((c) => c.id === catalogId);
  if (!catalog) return "Fragenkatalog nicht gefunden.";
  if (catalog.status !== "draft") return "Freigegebene Versionen sind unveränderlich. Legen Sie eine neue Version an.";
  return catalog;
}

const clean = (q: CatalogQuestionDraft) => ({
  text: q.text.trim(),
  guidance: q.guidance?.trim() || undefined,
  evidenceHint: q.evidenceHint?.trim() || undefined,
  requirementIds: q.requirementIds,
});

/** Neue Version als Entwurf: die Fragen der freigegebenen Version werden kopiert, nie referenziert */
export function createCatalogDraft(data: SeedData, session: Session, baseId: ID): CommandOutput {
  const base = data.catalogs.find((c) => c.id === baseId);
  const guard = checkCreateCatalogDraft(base, data.catalogs);
  if (!guard.ok || !base) return fail(data, guard.blockers);
  const id = newId("cat");
  const version = nextCatalogVersion(data.catalogs, base.key);
  const draft = {
    id,
    key: base.key,
    name: base.name,
    version,
    status: "draft" as const,
    standardIds: [...base.standardIds],
    supersedesCatalogId: base.id,
    questions: base.questions.map((q) => ({ ...q, id: newId("cq"), requirementIds: [...q.requirementIds] })),
  };
  const next = emit({ ...data, catalogs: [...data.catalogs, draft] }, session, {
    entityType: "catalog",
    entityId: id,
    action: "version_created",
    summary: `${label(base.name, version)} als Entwurf angelegt`,
    changes: [{ field: "Basis", before: null, after: `Version ${base.version}` }],
  });
  return succeed(next, [], id);
}

/** Frage ändern (questionId gesetzt) oder ergänzen (questionId leer) */
export function saveCatalogQuestion(
  data: SeedData,
  session: Session,
  catalogId: ID,
  questionId: ID | null,
  input: CatalogQuestionDraft,
): CommandOutput {
  const catalog = draftOf(data, catalogId);
  if (typeof catalog === "string") return fail(data, [catalog]);
  const existing = questionId ? catalog.questions.find((q) => q.id === questionId) : undefined;
  if (questionId && !existing) return fail(data, ["Frage nicht gefunden."]);
  const values = clean(input);
  const blockers = checkCatalogQuestion(values, catalog, data.requirements);
  if (blockers.length > 0) return fail(data, blockers);

  let questions: CatalogQuestion[];
  let summary: string;
  const changes: FieldChange[] = [];
  if (existing) {
    questions = catalog.questions.map((q) => (q.id === existing.id ? { ...q, ...values } : q));
    summary = `Frage ${catalog.questions.indexOf(existing) + 1} in ${label(catalog.name, catalog.version)} geändert`;
    if (values.text !== existing.text) changes.push({ field: "Fragetext", before: existing.text, after: values.text });
    if ((values.guidance ?? "") !== (existing.guidance ?? "")) {
      changes.push({ field: "Hinweis", before: existing.guidance ?? null, after: values.guidance ?? null });
    }
    if ((values.evidenceHint ?? "") !== (existing.evidenceHint ?? "")) {
      changes.push({ field: "Typische Nachweise", before: existing.evidenceHint ?? null, after: values.evidenceHint ?? null });
    }
    if ([...values.requirementIds].sort().join() !== [...existing.requirementIds].sort().join()) {
      changes.push({ field: "Anforderungen", before: existing.requirementIds, after: values.requirementIds });
    }
  } else {
    questions = [...catalog.questions, { id: newId("cq"), ...values }];
    summary = `Frage ${questions.length} in ${label(catalog.name, catalog.version)} ergänzt`;
    changes.push({ field: "Fragetext", before: null, after: values.text });
  }
  const next = emit({ ...data, catalogs: replaceById(data.catalogs, catalog.id, { questions }) }, session, {
    entityType: "catalog",
    entityId: catalog.id,
    action: "updated",
    summary,
    changes,
  });
  return succeed(next);
}

export function removeCatalogQuestion(data: SeedData, session: Session, catalogId: ID, questionId: ID): CommandOutput {
  const catalog = draftOf(data, catalogId);
  if (typeof catalog === "string") return fail(data, [catalog]);
  const index = catalog.questions.findIndex((q) => q.id === questionId);
  if (index < 0) return fail(data, ["Frage nicht gefunden."]);
  const removed = catalog.questions[index];
  const next = emit(
    { ...data, catalogs: replaceById(data.catalogs, catalog.id, { questions: catalog.questions.filter((q) => q.id !== questionId) }) },
    session,
    {
      entityType: "catalog",
      entityId: catalog.id,
      action: "updated",
      summary: `Frage ${index + 1} aus ${label(catalog.name, catalog.version)} entfernt`,
      changes: [{ field: "Fragetext", before: removed.text, after: null }],
    },
  );
  return succeed(next);
}

export function moveCatalogQuestion(data: SeedData, session: Session, catalogId: ID, questionId: ID, direction: -1 | 1): CommandOutput {
  const catalog = draftOf(data, catalogId);
  if (typeof catalog === "string") return fail(data, [catalog]);
  const from = catalog.questions.findIndex((q) => q.id === questionId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= catalog.questions.length) return fail(data, ["Die Frage steht bereits am Rand der Liste."]);
  const questions = [...catalog.questions];
  [questions[from], questions[to]] = [questions[to], questions[from]];
  const next = emit({ ...data, catalogs: replaceById(data.catalogs, catalog.id, { questions }) }, session, {
    entityType: "catalog",
    entityId: catalog.id,
    action: "updated",
    summary: `Frage ${from + 1} in ${label(catalog.name, catalog.version)} auf Position ${to + 1} verschoben`,
    changes: [{ field: "Position", before: from + 1, after: to + 1 }],
  });
  return succeed(next);
}

/** Entwurf verwerfen. Der Verlauf bleibt erhalten, nur der Entwurf selbst entfällt. */
export function discardCatalogDraft(data: SeedData, session: Session, catalogId: ID): CommandOutput {
  const catalog = draftOf(data, catalogId);
  if (typeof catalog === "string") return fail(data, [catalog]);
  const next = emit({ ...data, catalogs: data.catalogs.filter((c) => c.id !== catalog.id) }, session, {
    entityType: "catalog",
    entityId: catalog.id,
    action: "status_changed",
    summary: `Entwurf ${label(catalog.name, catalog.version)} verworfen`,
  });
  return succeed(next);
}

/** Freigabe: Entwurf wird aktuell, die bisherige Version außer Kraft. Laufende Checklisten bleiben Snapshots. */
export function releaseCatalogVersion(data: SeedData, session: Session, catalogId: ID, reason: string): CommandOutput {
  const catalog = draftOf(data, catalogId);
  if (typeof catalog === "string") return fail(data, [catalog]);
  const base = data.catalogs.find((c) => c.id === catalog.supersedesCatalogId);
  const guard = checkReleaseCatalog(catalog, base, data.requirements, reason);
  if (!guard.ok) return fail(data, guard.blockers);

  let catalogs = replaceById(data.catalogs, catalog.id, {
    status: "released",
    releasedAt: demoNow(),
    releasedById: session.personId,
    changeNote: reason.trim(),
  });
  if (base) catalogs = replaceById(catalogs, base.id, { status: "retired" });
  let next: SeedData = emit({ ...data, catalogs }, session, {
    entityType: "catalog",
    entityId: catalog.id,
    action: "released",
    summary: `${label(catalog.name, catalog.version)} freigegeben`,
    reason: reason.trim(),
    changes: [{ field: "status", before: "draft", after: "released" }],
  });
  if (base) {
    next = emit(next, session, {
      entityType: "catalog",
      entityId: base.id,
      action: "status_changed",
      summary: `${label(base.name, base.version)} außer Kraft gesetzt`,
      reason: `Abgelöst durch Version ${catalog.version}`,
      changes: [{ field: "status", before: "released", after: "retired" }],
    });
  }
  return succeed(next);
}
