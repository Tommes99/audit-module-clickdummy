import type {
  ActionKind,
  ActionSource,
  ActionStatus,
  CorrectiveAction,
  EffectivenessResult,
  ID,
  ISODate,
  SeedData,
} from "@/types/domain";
import {
  checkActionTransition,
  checkEffectivenessApproval,
  checkEffectivenessRecord,
  requiresCapa,
} from "@/domain/rules";
import { actionKindShortLabels, actionStatusLabels, effectivenessResultLabels } from "@/domain/labels";
import { DEMO_TODAY, demoNow, requiresReason } from "@/domain/workflows";
import { nextNumber, newId } from "@/domain/factories";
import type { Session } from "@/domain/permissions";
import { emit, fail, personName, reasonMissing, replaceById, succeed, type CommandOutput } from "@/store/helpers";

export interface ActionDraft {
  source: ActionSource;
  kind: ActionKind;
  title: string;
  description: string;
  ownerId: ID;
  dueDate: ISODate;
}

export function createAction(data: SeedData, session: Session, draft: ActionDraft): CommandOutput {
  if (draft.source.type !== "finding") return fail(data, ["Im Dummy sind nur Maßnahmen zu Feststellungen vorgesehen."]);
  const finding = data.findings.find((f) => f.id === draft.source.id);
  if (!finding) return fail(data, ["Feststellung nicht gefunden."]);

  const blockers: string[] = [];
  // Abweichungen: Maßnahmen nach Annahme. Übrige Klassifizierungen dürfen früher Maßnahmen erhalten.
  const allowed = requiresCapa(finding.classification)
    ? ["accepted", "in_treatment"]
    : ["open", "accepted", "in_treatment"];
  if (!allowed.includes(finding.status)) {
    blockers.push(
      finding.status === "effectiveness_check"
        ? "In der Wirksamkeitsprüfung werden keine Maßnahmen angelegt. Bei nicht wirksamem Ergebnis die Feststellung zurück in Bearbeitung setzen."
        : finding.status === "closed"
          ? "Die Feststellung ist geschlossen, neue Maßnahmen sind nicht vorgesehen."
          : finding.status === "rejected"
            ? "Die Feststellung ist zurückgewiesen, Maßnahmen sind nicht vorgesehen."
            : requiresCapa(finding.classification)
              ? "Maßnahmen werden nach Annahme der Feststellung angelegt."
              : "Für diesen Status der Feststellung sind keine neuen Maßnahmen vorgesehen.",
    );
  }
  if (!draft.title.trim()) blockers.push("Titel der Maßnahme angeben.");
  if (!draft.ownerId) blockers.push("Verantwortliche Person festlegen.");
  if (!draft.dueDate) blockers.push("Frist festlegen.");
  if (blockers.length > 0) return fail(data, blockers);

  const id = newId("act");
  const number = nextNumber("M", Number(DEMO_TODAY.slice(0, 4)), data.actions.map((a) => a.number));
  const action: CorrectiveAction = {
    id,
    number,
    source: draft.source,
    kind: draft.kind,
    title: draft.title.trim(),
    description: draft.description.trim(),
    ownerId: draft.ownerId,
    dueDate: draft.dueDate,
    status: "open",
    createdById: session.personId,
    createdAt: demoNow(),
    evidenceIds: [],
  };
  const next = emit(
    {
      ...data,
      actions: [...data.actions, action],
      findings: replaceById(data.findings, finding.id, { actionIds: [...finding.actionIds, id] }),
    },
    session,
    {
      entityType: "action",
      entityId: id,
      auditId: finding.auditId,
      action: "created",
      summary: `${actionKindShortLabels[draft.kind]} ${number} zu ${finding.number} angelegt, verantwortlich ${personName(data, draft.ownerId)}`,
    },
  );
  return succeed(next, [], id);
}

export function transitionAction(
  data: SeedData,
  session: Session,
  id: ID,
  to: ActionStatus,
  reason?: string,
): CommandOutput {
  const action = data.actions.find((a) => a.id === id);
  if (!action) return fail(data, ["Maßnahme nicht gefunden."]);
  const finding = data.findings.find((f) => f.id === action.source.id);
  const guard = checkActionTransition(action, to, finding);
  const blockers = [...guard.blockers];
  if (guard.ok && requiresReason("action", action.status, to)) blockers.push(...reasonMissing(reason));
  if (blockers.length > 0) return fail(data, blockers);

  const patch: Partial<CorrectiveAction> = { status: to };
  if (to === "done") Object.assign(patch, { completedAt: demoNow(), completionNote: reason?.trim() || undefined });
  if (action.status === "done") Object.assign(patch, { completedAt: undefined, completionNote: undefined });

  const next = emit({ ...data, actions: replaceById(data.actions, id, patch) }, session, {
    entityType: "action",
    entityId: id,
    auditId: finding?.auditId,
    action: "status_changed",
    summary: `Maßnahme ${action.number} von "${actionStatusLabels[action.status].label}" auf "${actionStatusLabels[to].label}" gesetzt`,
    changes: [{ field: "status", before: action.status, after: to }],
    reason: reason?.trim() || undefined,
  });
  return succeed(next);
}

export function planEffectivenessCheck(
  data: SeedData,
  session: Session,
  findingId: ID,
  plannedDate: ISODate,
  method: string,
): CommandOutput {
  const finding = data.findings.find((f) => f.id === findingId);
  if (!finding) return fail(data, ["Feststellung nicht gefunden."]);
  const blockers: string[] = [];
  if (!["in_treatment", "effectiveness_check"].includes(finding.status)) {
    blockers.push("Die Wirksamkeitsprüfung wird in Bearbeitung oder zur Prüfung geplant.");
  }
  const current = data.effectivenessChecks.find((c) => c.id === finding.effectivenessCheckId);
  if (current && current.result !== "not_effective") blockers.push("Es ist bereits eine Wirksamkeitsprüfung geplant.");
  if (!plannedDate) blockers.push("Termin festlegen.");
  if (!method.trim()) blockers.push("Prüfmethode beschreiben.");
  if (blockers.length > 0) return fail(data, blockers);

  const id = newId("eff");
  const next = emit(
    {
      ...data,
      effectivenessChecks: [...data.effectivenessChecks, { id, findingId, plannedDate, method: method.trim(), result: null }],
      findings: replaceById(data.findings, findingId, { effectivenessCheckId: id }),
    },
    session,
    {
      entityType: "effectiveness_check",
      entityId: id,
      auditId: finding.auditId,
      action: "created",
      summary: `Wirksamkeitsprüfung zu ${finding.number} geplant`,
    },
  );
  return succeed(next, [], id);
}

export function recordEffectivenessCheck(
  data: SeedData,
  session: Session,
  checkId: ID,
  result: EffectivenessResult,
  comment: string,
): CommandOutput {
  const check = data.effectivenessChecks.find((c) => c.id === checkId);
  const finding = data.findings.find((f) => f.id === check?.findingId);
  if (!check || !finding) return fail(data, ["Wirksamkeitsprüfung nicht gefunden."]);
  const guard = checkEffectivenessRecord(finding, check, result, comment);
  const blockers = [...guard.blockers];
  if (check.approvedById) blockers.push("Die Prüfung wurde bereits bestätigt und ist nicht mehr änderbar.");
  if (blockers.length > 0) return fail(data, blockers);

  const patch = { performedById: session.personId, performedAt: demoNow(), result, comment: comment.trim() };
  const next = emit({ ...data, effectivenessChecks: replaceById(data.effectivenessChecks, checkId, patch) }, session, {
    entityType: "effectiveness_check",
    entityId: checkId,
    auditId: finding.auditId,
    action: "updated",
    summary: `Wirksamkeitsprüfung zu ${finding.number} durchgeführt: ${effectivenessResultLabels[result].label.toLowerCase()}`,
    changes: [{ field: "result", before: check.result, after: result }],
  });
  return succeed(next);
}

/** Vier-Augen-Prinzip: Bestätigung durch eine andere Person als die Durchführende */
export function approveEffectivenessCheck(data: SeedData, session: Session, checkId: ID): CommandOutput {
  const check = data.effectivenessChecks.find((c) => c.id === checkId);
  const finding = data.findings.find((f) => f.id === check?.findingId);
  const guard = checkEffectivenessApproval(check, session.personId, finding);
  if (!guard.ok || !check || !finding) return fail(data, guard.blockers);

  const next = emit(
    {
      ...data,
      effectivenessChecks: replaceById(data.effectivenessChecks, checkId, {
        approvedById: session.personId,
        approvedAt: demoNow(),
      }),
    },
    session,
    {
      entityType: "effectiveness_check",
      entityId: checkId,
      auditId: finding.auditId,
      action: "released",
      summary: `Wirksamkeitsprüfung zu ${finding.number} durch zweite Person bestätigt`,
    },
  );
  return succeed(next);
}
