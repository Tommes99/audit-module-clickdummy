import type { ID, SeedData } from "@/types/domain";
import { verifyChain } from "@/lib/audit-trail";
import { requiresCapa } from "@/domain/rules";

/**
 * Referenzielle Integrität und fachliche Invarianten.
 * Nach jeder Änderung an Seed oder Datenmodell ausführen: npm run validate:seed
 */
export function validateSeed(s: SeedData): string[] {
  const errors: string[] = [];
  const ids = <T extends { id: ID }>(list: T[]) => new Set(list.map((x) => x.id));

  const personIds = ids(s.persons);
  const siteIds = ids(s.sites);
  const processIds = ids(s.processes);
  const standardIds = ids(s.standards);
  const requirementIds = ids(s.requirements);
  const auditIds = ids(s.audits);
  const findingIds = ids(s.findings);
  const actionIds = ids(s.actions);
  const evidenceIds = ids(s.evidence);
  const checklistIds = ids(s.checklists);
  const reportIds = ids(s.reports);
  const riskIds = ids(s.risks);
  const kpiIds = ids(s.kpis);
  const effIds = ids(s.effectivenessChecks);
  const itemIds = new Set(s.checklists.flatMap((c) => c.items.map((i) => i.id)));

  const ref = (set: Set<ID>, id: ID | undefined | null, where: string) => {
    if (id && !set.has(id)) errors.push(`${where}: unbekannte Referenz "${id}"`);
  };
  const refs = (set: Set<ID>, list: ID[], where: string) => list.forEach((id) => ref(set, id, where));

  // Eindeutigkeit über alle Sammlungen
  const all = [
    ...s.sites, ...s.processes, ...s.persons, ...s.standards, ...s.requirements, ...s.catalogs,
    ...s.programmes, ...s.audits, ...s.planSlots, ...s.checklists, ...s.evidence, ...s.findings,
    ...s.actions, ...s.effectivenessChecks, ...s.reports, ...s.risks, ...s.kpis, ...s.events,
  ].map((x) => x.id);
  const dupes = all.filter((id, i) => all.indexOf(id) !== i);
  if (dupes.length) errors.push(`Doppelte IDs: ${[...new Set(dupes)].join(", ")}`);

  s.processes.forEach((p) => { ref(personIds, p.ownerId, `Prozess ${p.id}`); refs(siteIds, p.siteIds, `Prozess ${p.id}`); });
  s.persons.forEach((p) => { ref(siteIds, p.siteId, `Person ${p.id}`); refs(standardIds, p.auditorQualifications, `Person ${p.id}`); });
  s.requirements.forEach((r) => { ref(standardIds, r.standardId, `Anforderung ${r.id}`); refs(requirementIds, r.relatedRequirementIds ?? [], `Anforderung ${r.id}`); });
  s.catalogs.forEach((c) => c.questions.forEach((q) => refs(requirementIds, q.requirementIds, `Katalogfrage ${q.id}`)));

  s.audits.forEach((a) => {
    const w = `Audit ${a.number}`;
    ref(siteIds, a.siteId, w);
    refs(standardIds, a.standardIds, w);
    refs(requirementIds, a.requirementIds, w);
    refs(processIds, a.processIds, w);
    refs(personIds, [a.leadAuditorId, ...a.auditorIds, ...a.auditeeIds], w);
    ref(checklistIds, a.checklistId, w);
    ref(reportIds, a.currentReportId, w);
    if (!a.auditorIds.includes(a.leadAuditorId)) errors.push(`${w}: Leitung fehlt in auditorIds`);
    if (a.siteId === null && a.type !== "supplier") errors.push(`${w}: siteId null nur bei Lieferantenaudits`);
    // Scope-Anforderungen müssen zu Normen im Scope gehören
    a.requirementIds.forEach((rid) => {
      const req = s.requirements.find((r) => r.id === rid);
      if (req && !a.standardIds.includes(req.standardId)) errors.push(`${w}: ${rid} gehört zu keiner Norm im Scope`);
    });
  });

  s.planSlots.forEach((p) => { ref(auditIds, p.auditId, `Slot ${p.id}`); ref(processIds, p.processId, `Slot ${p.id}`); refs(personIds, p.participantIds, `Slot ${p.id}`); refs(requirementIds, p.requirementIds, `Slot ${p.id}`); });

  s.checklists.forEach((c) => {
    ref(auditIds, c.auditId, `Checkliste ${c.id}`);
    c.items.forEach((i) => {
      const w = `Checklistenpunkt ${i.id}`;
      refs(requirementIds, i.requirementIds, w);
      refs(evidenceIds, i.evidenceIds, w);
      refs(findingIds, i.findingIds, w);
      // Invariante 2: Rückverweis Punkt -> Feststellung
      i.findingIds.forEach((fid) => {
        const f = s.findings.find((x) => x.id === fid);
        if (f && f.checklistItemId !== i.id) errors.push(`${w}: Feststellung ${f.number} verweist nicht auf diesen Punkt`);
      });
      ref(findingIds, i.carriedOverFindingId, w);
      if (i.rating && !i.ratedById) errors.push(`${w}: Bewertung ohne ratedById`);
    });
  });

  s.evidence.forEach((e) => { ref(auditIds, e.auditId, `Nachweis ${e.id}`); ref(personIds, e.uploadedById, `Nachweis ${e.id}`); });

  s.findings.forEach((f) => {
    const w = `Feststellung ${f.number}`;
    ref(auditIds, f.auditId, w);
    refs(requirementIds, f.requirementIds, w);
    ref(siteIds, f.siteId, w);
    ref(processIds, f.processId, w);
    ref(itemIds, f.checklistItemId, w);
    refs(evidenceIds, f.evidenceIds, w);
    refs(actionIds, f.actionIds, w);
    ref(effIds, f.effectivenessCheckId, w);
    refs(riskIds, f.links.riskIds, w);
    refs(kpiIds, f.links.kpiIds, w);
    refs(personIds, [f.raisedById, f.ownerId, f.acceptedById, f.closedById].filter(Boolean) as ID[], w);
    if (f.requirementIds.length === 0) errors.push(`${w}: Pflichtbezug zu Anforderung fehlt`);
    // Invariante 1: Prozess immer, Standort außer bei Lieferantenaudits
    if (!f.processId) errors.push(`${w}: Pflichtbezug zu Prozess fehlt`);
    const fAudit = s.audits.find((a) => a.id === f.auditId);
    if (fAudit && fAudit.type !== "supplier" && !f.siteId) errors.push(`${w}: Pflichtbezug zu Standort fehlt`);
    if (requiresCapa(f.classification) && f.status !== "draft" && (!f.ownerId || !f.dueDate)) {
      errors.push(`${w}: Abweichung ohne Verantwortliche oder Frist`);
    }
    if (requiresCapa(f.classification) && f.status === "closed") {
      const eff = s.effectivenessChecks.find((e) => e.id === f.effectivenessCheckId);
      if (!eff || eff.result !== "effective" || !eff.approvedById || eff.approvedById === eff.performedById) {
        errors.push(`${w}: geschlossen ohne gültige Wirksamkeitsprüfung (Vier-Augen-Prinzip)`);
      }
    }
    if (f.checklistItemId) {
      const item = s.checklists.flatMap((c) => c.items).find((i) => i.id === f.checklistItemId);
      if (item && !item.findingIds.includes(f.id)) errors.push(`${w}: Rückverweis im Checklistenpunkt fehlt`);
    }
  });

  s.actions.forEach((a) => {
    const w = `Maßnahme ${a.number}`;
    if (a.source.type === "finding") {
      ref(findingIds, a.source.id, w);
      const f = s.findings.find((x) => x.id === a.source.id);
      if (f && !f.actionIds.includes(a.id)) errors.push(`${w}: Rückverweis in Feststellung fehlt`);
    }
    refs(personIds, [a.ownerId, a.createdById], w);
    refs(evidenceIds, a.evidenceIds, w);
  });

  s.reports.forEach((r) => {
    const w = `Bericht ${r.id}`;
    ref(auditIds, r.auditId, w);
    ref(reportIds, r.supersedesReportId, w);
    refs(evidenceIds, r.attachmentEvidenceIds, w);
    refs(personIds, r.distributionIds, w);
    if (r.version > 1 && !r.changeReason) errors.push(`${w}: Version > 1 ohne Änderungsbegründung`);
    if ((r.status === "released" || r.status === "superseded") && !r.contentHash) errors.push(`${w}: freigegeben ohne contentHash`);
  });

  s.events.forEach((e) => { ref(personIds, e.actorId, `Event ${e.id}`); ref(auditIds, e.auditId, `Event ${e.id}`); });
  const chain = verifyChain(s.events);
  if (!chain.valid) errors.push(`Audit-Trail: ${chain.message}`);

  return errors;
}
