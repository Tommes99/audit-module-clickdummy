/**
 * Spielt das Demo-Drehbuch (CLAUDE.md Abschnitt 14, Schritte 4 bis 11) gegen die
 * Store-Commands durch und prüft die Erwartungen. Aufruf: npm run demo:check
 */
import { freshSeed } from "@/data/seed";
import { validateSeed } from "@/data/seed/validate";
import { verifyChain } from "@/lib/audit-trail";
import { demoPersonas, type Session } from "@/domain/permissions";
import type { CommandOutput } from "@/store/helpers";
import type { SeedData } from "@/types/domain";
import * as audit from "@/store/commands/audit";
import * as checklist from "@/store/commands/checklist";
import * as finding from "@/store/commands/finding";
import * as capa from "@/store/commands/capa";
import * as report from "@/store/commands/report";
import * as catalogCmd from "@/store/commands/catalog";

const [keller, brandt, richter, demir] = demoPersonas.map((p) => ({ ...p })) as [Session, Session, Session, Session];
let data: SeedData = freshSeed();
let failures = 0;

function expect(label: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  ok   ${label}`);
  else {
    failures += 1;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

/** Führt einen Command aus, übernimmt die Daten nur bei Erfolg (wie der Store) */
function step(out: CommandOutput): CommandOutput["result"] {
  if (out.result.ok) data = out.data;
  return out.result;
}

const A9 = "aud-2026-09";
console.log("Schritt 4: Audit starten");
let r = step(audit.transitionAudit(data, keller, A9, "in_progress"));
expect("Start zunächst blockiert (2 Konflikte)", !r.ok && r.blockers.length === 2, r);
expect("Warnung: keine Qualifikation ISO 45001", r.warnings.length === 1);
expect("Wagner entfernt", step(audit.removeAuditor(data, keller, A9, "p-wagner")).ok);
expect("Brandt hinzugefügt", step(audit.assignAuditor(data, keller, A9, "p-brandt")).ok);
r = step(audit.transitionAudit(data, keller, A9, "in_progress"));
expect("Audit gestartet", r.ok, r);

console.log("Schritt 5: Checkliste, Punkt 4");
const item4 = "ci-2026-09-04";
expect("Foto angehängt", step(checklist.attachEvidence(data, keller, { type: "checklist_item", id: item4 }, { kind: "photo", title: "Halle 3, Gasse 4 ohne Fußgängerweg", fileName: "halle3-gasse4.jpg", mimeType: "image/jpeg", sizeBytes: 1_204_000 })).ok);
expect("Punkt 4 als Abweichung bewertet", step(checklist.rateItem(data, keller, item4, "deviation", "GBU Stand 11/2025, Umbau Q2/2026")).ok);

console.log("Schritt 6: Feststellung");
r = step(finding.createFinding(data, keller, {
  auditId: A9,
  checklistItemId: item4,
  classification: "minor_nc",
  title: "Gefährdungsbeurteilung Intralogistik Halle 3 nach Umbau nicht aktualisiert",
  description: "Text aus KI-Vorschlag",
  requirementIds: ["req-45001-6.1.2", "req-45001-8.1.3"],
  processId: "proc-log-lei",
  ownerId: "p-richter",
  dueDate: "2026-11-13",
  aiKeys: ["finding-gbu-halle3"],
}));
const fId = r.createdId!;
const f = () => data.findings.find((x) => x.id === fId)!;
expect("Nummer F-2026-007", f()?.number === "F-2026-007", f()?.number);
expect("Nachweis des Auditee am Punkt übernommen (ev-09-01 + Foto)", f().evidenceIds.length === 2 && f().evidenceIds.includes("ev-09-01"));
expect("KI-Flag gesetzt", f().aiAssisted);
expect("Rückverweis im Checklistenpunkt", data.checklists.some((c) => c.items.some((i) => i.id === item4 && i.findingIds.includes(fId))));
expect("Verknüpfungen übernommen", step(finding.linkFinding(data, keller, fId, { riskIds: ["risk-012"], kpiIds: ["kpi-as-02"] }, "links-gbu-halle3")).ok);
expect("Status Offen", step(finding.transitionFinding(data, keller, fId, "open")).ok && f().status === "open");

console.log("Schritt 8: Auditee (Richter)");
expect("Angenommen", step(finding.transitionFinding(data, richter, fId, "accepted")).ok);
r = step(finding.transitionFinding(data, richter, fId, "in_treatment"));
expect("In Bearbeitung blockiert ohne Ursachenanalyse und Korrekturmaßnahme", !r.ok && r.blockers.length === 2, r);
expect("Ursachenanalyse (KI)", step(finding.setRootCause(data, richter, fId, { method: "five_why", steps: ["a", "b", "c"], rootCause: "Änderungsprozess ohne Prüfschritt" }, "rca-gbu-halle3")).ok);
const corr = step(capa.createAction(data, richter, { source: { type: "finding", id: fId }, kind: "correction", title: "Fußgängerwege in Halle 3 provisorisch markieren", description: "", ownerId: "p-demir", dueDate: "2026-10-16" }));
expect("Korrektur M-2026-007", corr.ok && data.actions.find((a) => a.id === corr.createdId)?.number === "M-2026-007");
r = step(finding.transitionFinding(data, richter, fId, "in_treatment"));
expect("Korrektur allein genügt nicht", !r.ok && r.blockers.some((b) => b.includes("Korrekturmaßnahme")), r);
const capaAct = step(capa.createAction(data, richter, { source: { type: "finding", id: fId }, kind: "corrective_action", title: "Prüfung der Arbeitsschutzauswirkungen als Pflichtschritt im Änderungsprozess", description: "", ownerId: "p-richter", dueDate: "2026-11-13" }));
expect("Korrekturmaßnahme M-2026-008", capaAct.ok && data.actions.find((a) => a.id === capaAct.createdId)?.number === "M-2026-008");
expect("Status In Bearbeitung", step(finding.transitionFinding(data, richter, fId, "in_treatment")).ok);
expect("Demir setzt Korrektur in Umsetzung", step(capa.transitionAction(data, demir, corr.createdId!, "in_progress")).ok);

console.log("Schritt 9: Bericht");
r = step(audit.transitionAudit(data, keller, A9, "reporting"));
expect("Berichtserstellung blockiert (offene Punkte)", !r.ok, r);
expect("Übrige Punkte als konform (Demo-Abkürzung)", step(checklist.markRemainingConform(data, keller, "chk-2026-09")).ok);
r = step(audit.transitionAudit(data, keller, A9, "reporting"));
expect("Berichtserstellung", r.ok, r);
const rep = step(report.createReportDraft(data, keller, A9, true));
expect("KI-Berichtsentwurf", rep.ok, rep);
expect("Freigabe ohne Prüfung nicht möglich", !step(report.releaseReport(data, keller, rep.createdId!)).ok);
expect("Zur Prüfung", step(report.submitReport(data, keller, rep.createdId!)).ok);
expect("Bericht freigegeben", step(report.releaseReport(data, keller, rep.createdId!)).ok);
const released = data.reports.find((x) => x.id === rep.createdId)!;
expect("contentHash gesetzt", Boolean(released.contentHash));
expect("Entwurf ist nach Freigabe gesperrt", !step(report.updateReportDraft(data, keller, released.id, { summary: "x" })).ok);
expect("Audit freigegeben", step(audit.transitionAudit(data, keller, A9, "released")).ok);
expect("Abschluss blockiert (offene Abweichungen)", !step(audit.transitionAudit(data, keller, A9, "closed")).ok);
expect("Neue Version ohne Begründung abgelehnt", !step(report.createReportVersion(data, keller, released.id, " ")).ok);
const v2 = step(report.createReportVersion(data, keller, released.id, "Korrektur der Zusammenfassung"));
expect("Version 2 angelegt, Version 1 ersetzt", v2.ok && data.reports.find((x) => x.id === released.id)?.status === "superseded");

console.log("Schritt 10: Wirksamkeitsprüfung F-2026-005");
const eff = "eff-002";
expect("Schließen blockiert (nicht durchgeführt)", !step(finding.transitionFinding(data, keller, "f-2026-005", "closed")).ok);
expect("Prüfung durchgeführt (Keller)", step(capa.recordEffectivenessCheck(data, keller, eff, "effective", "EnPI-Werte plausibel")).ok);
r = step(finding.transitionFinding(data, keller, "f-2026-005", "closed"));
expect("Schließen blockiert (Bestätigung fehlt)", !r.ok && r.blockers.some((b) => b.includes("zweite Person")), r);
expect("Selbstbestätigung abgelehnt", !step(capa.approveEffectivenessCheck(data, keller, eff)).ok);
expect("Bestätigung durch Brandt", step(capa.approveEffectivenessCheck(data, brandt, eff)).ok);
expect("F-2026-005 geschlossen", step(finding.transitionFinding(data, keller, "f-2026-005", "closed")).ok);

console.log("Schritt 12: Fragenkatalog anpassen");
const checklistsBefore = JSON.stringify(data.checklists);
expect("Entwurf aus Version 2 (außer Kraft) abgelehnt", !step(catalogCmd.createCatalogDraft(data, keller, "cat-umas-v2")).ok);
const draftOut = step(catalogCmd.createCatalogDraft(data, keller, "cat-umas-v3"));
expect("Entwurf Version 4 angelegt", draftOut.ok && Boolean(draftOut.createdId), draftOut);
const draftId = draftOut.createdId!;
const draft = () => data.catalogs.find((c) => c.id === draftId)!;
expect("Entwurf hat Version 4, Fragen kopiert (neue IDs)", draft().version === 4 && draft().questions.every((q) => !q.id.startsWith("cq-umas3")));
expect("Zweiter Entwurf abgelehnt", !step(catalogCmd.createCatalogDraft(data, keller, "cat-umas-v3")).ok);
expect("Freigabe ohne Änderung abgelehnt", !step(catalogCmd.releaseCatalogVersion(data, keller, draftId, "Test")).ok);
expect("Änderung an freigegebener Version abgelehnt", !step(catalogCmd.removeCatalogQuestion(data, keller, "cat-umas-v3", "cq-umas3-01")).ok);
expect("Frage ohne Anforderung abgelehnt", !step(catalogCmd.saveCatalogQuestion(data, keller, draftId, null, { text: "Neue Frage", requirementIds: [] })).ok);
expect("Anforderung fremder Norm abgelehnt", !step(catalogCmd.saveCatalogQuestion(data, keller, draftId, null, { text: "Neue Frage", requirementIds: ["req-9001-7.5"] })).ok);
expect("Frage ergänzt", step(catalogCmd.saveCatalogQuestion(data, keller, draftId, null, { text: "Sind Fußgängerwege in Hallen gekennzeichnet?", requirementIds: ["req-45001-8.1.3"] })).ok);
expect("Frage geändert", step(catalogCmd.saveCatalogQuestion(data, keller, draftId, draft().questions[0].id, { ...draft().questions[0], text: draft().questions[0].text + " (präzisiert)" })).ok);
expect("Frage verschoben", step(catalogCmd.moveCatalogQuestion(data, keller, draftId, draft().questions[1].id, -1)).ok);
expect("Freigabe ohne Begründung abgelehnt", !step(catalogCmd.releaseCatalogVersion(data, keller, draftId, " ")).ok);
expect("Version 4 freigegeben", step(catalogCmd.releaseCatalogVersion(data, keller, draftId, "Fußwege ergänzt")).ok);
expect("Version 3 außer Kraft, Version 4 freigegeben", data.catalogs.find((c) => c.id === "cat-umas-v3")?.status === "retired" && draft().status === "released");
expect("Laufende Checklisten unverändert (Snapshot)", JSON.stringify(data.checklists) === checklistsBefore);
expect("Freigegebene Version nicht mehr änderbar", !step(catalogCmd.removeCatalogQuestion(data, keller, draftId, draft().questions[0].id)).ok);
const draft2 = step(catalogCmd.createCatalogDraft(data, keller, draftId));
expect("Entwurf verwerfen", draft2.ok && step(catalogCmd.discardCatalogDraft(data, keller, draft2.createdId!)).ok);

console.log("Schritt 11: Verlauf");
const chain = verifyChain(data.events);
expect("Kette gültig", chain.valid, chain);
expect("KI-Events markiert", data.events.filter((e) => e.aiGenerated && e.id > "evt-00029").length >= 4);
expect("Demo-Abkürzung geloggt", data.events.some((e) => e.summary.startsWith("Demo-Abkürzung")));
const errors = validateSeed(data);
expect("Invarianten (validateSeed) nach der Demo", errors.length === 0, errors);

console.log(failures === 0 ? "\nAlle Prüfungen bestanden." : `\n${failures} Prüfung(en) fehlgeschlagen.`);
process.exit(failures === 0 ? 0 : 1);
