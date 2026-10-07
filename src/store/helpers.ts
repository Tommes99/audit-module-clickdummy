import type { AuditEvent, AuditEventDraft, ID, SeedData } from "@/types/domain";
import type { GuardResult } from "@/domain/rules";
import type { Session } from "@/domain/permissions";
import { demoNow } from "@/domain/workflows";
import { appendEvent } from "@/lib/audit-trail";

/** Ergebnis einer Store-Action: Guard-Ergebnis plus ggf. die ID des angelegten Objekts */
export type ActionResult = GuardResult & { createdId?: ID };

export interface CommandOutput {
  data: SeedData;
  result: ActionResult;
}

export type Command<A extends unknown[] = unknown[]> = (
  data: SeedData,
  session: Session,
  ...args: A
) => CommandOutput;

export const fail = (data: SeedData, blockers: string[], warnings: string[] = []): CommandOutput => ({
  data,
  result: { ok: false, blockers, warnings },
});

export const succeed = (data: SeedData, warnings: string[] = [], createdId?: ID): CommandOutput => ({
  data,
  result: { ok: true, blockers: [], warnings, createdId },
});

type EventInput = Omit<AuditEventDraft, "timestamp" | "actorId" | "actorRole" | "aiGenerated"> & {
  aiGenerated?: boolean;
};

/** Einzige Stelle, an der Commands Events schreiben. Läuft immer über appendEvent(). */
export function emit(data: SeedData, session: Session, event: EventInput): SeedData {
  const draft: AuditEventDraft = {
    ...event,
    timestamp: demoNow(),
    actorId: session.personId,
    actorRole: session.role,
    aiGenerated: event.aiGenerated ?? false,
  };
  const events: AuditEvent[] = appendEvent(data.events, draft);
  return { ...data, events };
}

export function replaceById<T extends { id: ID }>(list: T[], id: ID, patch: Partial<NoInfer<T>> | ((item: T) => T)): T[] {
  return list.map((item) => (item.id === id ? (typeof patch === "function" ? patch(item) : { ...item, ...patch }) : item));
}

export const personName = (data: SeedData, id: ID | undefined): string =>
  data.persons.find((p) => p.id === id)?.name ?? id ?? "unbekannt";

/** Alle Blocker zusammenführen, "Begründung angeben" bei fehlender Pflichtbegründung */
export const reasonMissing = (reason: string | undefined): string[] =>
  reason && reason.trim() ? [] : ["Begründung angeben."];
