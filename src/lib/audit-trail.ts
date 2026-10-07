import type { AuditEvent, AuditEventDraft } from "@/types/domain";
import { demoDigest, stableStringify } from "@/lib/hash";

export const GENESIS_HASH = "0".repeat(64);

function computeHash(draft: AuditEventDraft, sequence: number, prevHash: string): string {
  return demoDigest(stableStringify({ ...draft, sequence, prevHash }));
}

/**
 * Hängt ein Event an die Kette an. Einzige erlaubte Schreiboperation auf dem Trail.
 * Events werden nie geändert oder gelöscht.
 */
export function appendEvent(chain: readonly AuditEvent[], draft: AuditEventDraft): AuditEvent[] {
  const last = chain[chain.length - 1];
  const sequence = last ? last.sequence + 1 : 1;
  const prevHash = last ? last.hash : GENESIS_HASH;
  const event: AuditEvent = {
    ...draft,
    id: `evt-${String(sequence).padStart(5, "0")}`,
    sequence,
    prevHash,
    hash: computeHash(draft, sequence, prevHash),
  };
  return [...chain, event];
}

/** Baut eine Kette aus Entwürfen, chronologisch sortiert (für Seed-Daten) */
export function buildEventChain(drafts: readonly AuditEventDraft[]): AuditEvent[] {
  const sorted = [...drafts].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return sorted.reduce<AuditEvent[]>((chain, draft) => appendEvent(chain, draft), []);
}

export interface ChainVerification {
  valid: boolean;
  checked: number;
  /** Sequenznummer des ersten fehlerhaften Events */
  brokenAt?: number;
  message: string;
}

/** Für den Button "Integrität prüfen" im globalen Verlauf */
export function verifyChain(chain: readonly AuditEvent[]): ChainVerification {
  let prevHash = GENESIS_HASH;
  for (const event of chain) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- die ID ist nicht Teil des Hashes
    const { id: _id, sequence, prevHash: storedPrev, hash, ...draft } = event;
    const expected = computeHash(draft, sequence, prevHash);
    if (storedPrev !== prevHash || hash !== expected) {
      return {
        valid: false,
        checked: sequence,
        brokenAt: sequence,
        message: `Kette unterbrochen bei Eintrag ${sequence}. Der Eintrag oder ein Vorgänger wurde verändert.`,
      };
    }
    prevHash = hash;
  }
  return {
    valid: true,
    checked: chain.length,
    message: `${chain.length} Einträge geprüft, Kette vollständig und unverändert.`,
  };
}

/** Events eines Objekts oder Audits, neueste zuerst */
export function eventsFor(
  chain: readonly AuditEvent[],
  filter: { entityId?: string; auditId?: string },
): AuditEvent[] {
  return chain
    .filter(
      (e) =>
        (filter.entityId === undefined || e.entityId === filter.entityId) &&
        (filter.auditId === undefined || e.auditId === filter.auditId),
    )
    .sort((a, b) => b.sequence - a.sequence);
}
