import { requiresCapa } from "@/domain/rules";
import type { Finding } from "@/types/domain";

/** Schnellfilter der Feststellungsliste. Die Regeln leiten sich aus den Domänenfunktionen ab, nichts wird gespeichert. */
export type QuickFilter = "open_nc" | "to_accept" | "effectiveness";

export const QUICK_FILTERS: { value: QuickFilter; label: string; test: (f: Finding) => boolean }[] = [
  { value: "open_nc", label: "Offene Abweichungen", test: (f) => requiresCapa(f.classification) && f.status !== "closed" && f.status !== "draft" },
  { value: "to_accept", label: "Zur Annahme", test: (f) => f.status === "open" },
  { value: "effectiveness", label: "In Wirksamkeitsprüfung", test: (f) => f.status === "effectiveness_check" },
];

export interface FindingFilterState {
  quick: QuickFilter | "";
  status: string;
  classification: string;
  site: string;
  search: string;
}

export const NO_SITE = "none";
export const EMPTY_FINDING_FILTERS: FindingFilterState = { quick: "", status: "", classification: "", site: "", search: "" };

export const isQuickFilter = (v: string | null): v is QuickFilter => QUICK_FILTERS.some((q) => q.value === v);

export function matchesFilters(f: Finding, s: FindingFilterState): boolean {
  const quick = QUICK_FILTERS.find((q) => q.value === s.quick);
  if (quick && !quick.test(f)) return false;
  if (s.status && f.status !== s.status) return false;
  if (s.classification && f.classification !== s.classification) return false;
  if (s.site && (s.site === NO_SITE ? f.siteId !== null : f.siteId !== s.site)) return false;
  const q = s.search.trim().toLowerCase();
  return !q || f.number.toLowerCase().includes(q) || f.title.toLowerCase().includes(q);
}
