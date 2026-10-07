import type { SeedData } from "@/types/domain";
import { kpis, organisation, persons, processes, requirements, risks, sites, standards } from "@/data/seed/master-data";
import { catalogs } from "@/data/seed/catalogs";
import { audits, checklists, evidence, planSlots, programmes } from "@/data/seed/audits";
import { actions, effectivenessChecks, findings, reports } from "@/data/seed/findings";
import { events } from "@/data/seed/events";

export const seed: SeedData = {
  organisation,
  sites,
  processes,
  persons,
  standards,
  requirements,
  catalogs,
  programmes,
  audits,
  planSlots,
  checklists,
  evidence,
  findings,
  actions,
  effectivenessChecks,
  reports,
  risks,
  kpis,
  events,
};

/** Tiefe Kopie für resetToSeed(), damit der Store den Seed nie mutiert */
export function freshSeed(): SeedData {
  return structuredClone(seed);
}
