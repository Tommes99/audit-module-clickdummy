/**
 * Demo-Hash für den Clickdummy.
 *
 * ACHTUNG: FNV-1a ist NICHT kryptografisch. Er dient nur dazu, die Hash-Verkettung
 * des Audit-Trails synchron im Browser vorzuführen. Produktiv: SHA-256 serverseitig,
 * optional qualifizierter Zeitstempel.
 */

function fnv1a32(input: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** 64 Hex-Zeichen, damit es in der UI wie ein SHA-256 aussieht */
export function demoDigest(input: string): string {
  let out = "";
  for (let round = 0; round < 8; round++) {
    out += fnv1a32(`${round}:${input}`).toString(16).padStart(8, "0");
  }
  return out;
}

/** Stabile Serialisierung mit sortierten Schlüsseln, damit der Hash reproduzierbar ist */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}
