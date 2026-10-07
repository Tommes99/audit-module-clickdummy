import { seed } from "@/data/seed";
import { validateSeed } from "@/data/seed/validate";
import { verifyChain } from "@/lib/audit-trail";
import { checkAuditTransition, findImpartialityConflicts, findQualificationGaps } from "@/domain/rules";

const errors = validateSeed(seed);
if (errors.length) {
  console.error(`Seed ungültig (${errors.length} Fehler):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const demo = seed.audits.find((a) => a.id === "aud-2026-09")!;
console.log("Seed gültig.");
console.log(`  ${seed.audits.length} Audits, ${seed.findings.length} Feststellungen, ${seed.actions.length} Maßnahmen, ${seed.events.length} Events`);
console.log(`  ${verifyChain(seed.events).message}`);
console.log("Demo-Check A-2026-09 -> in_progress:");
console.log("  Konflikte:", findImpartialityConflicts(demo, seed).map((c) => c.message));
console.log("  Qualifikation:", findQualificationGaps(demo, seed).map((g) => g.message));
console.log("  Guard:", JSON.stringify(checkAuditTransition(demo, "in_progress", seed), null, 2));
