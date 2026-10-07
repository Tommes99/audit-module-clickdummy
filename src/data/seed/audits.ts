import type {
  Audit,
  AuditPlanSlot,
  AuditProgramme,
  Checklist,
  ChecklistRating,
  Evidence,
  ID,
  ISODateTime,
} from "@/types/domain";
import { createChecklistSnapshot } from "@/domain/factories";
import { demoDigest } from "@/lib/hash";
import { catalogs } from "@/data/seed/catalogs";
import { findings } from "@/data/seed/findings";

export const programmes: AuditProgramme[] = [
  {
    id: "prog-2026",
    organisationId: "org-mm",
    year: 2026,
    title: "Auditprogramm 2026",
    objectives: [
      "Zertifizierungen nach ISO 9001, 14001, 45001 und 50001 aufrechterhalten",
      "Alle Normkapitel je Standort im dreijährigen Zertifizierungszyklus abdecken",
      "Wirksamkeit der Korrekturmaßnahmen aus 2025 und aus dem Überwachungsaudit prüfen",
    ],
    ownerId: "p-keller",
    status: "approved",
    approvedById: "p-schulz",
    approvedAt: "2026-01-15T11:00:00+01:00",
  },
];

const umasScope = catalogs
  .find((c) => c.id === "cat-umas-v3")!
  .questions.flatMap((q) => q.requirementIds)
  .filter((id, i, all) => all.indexOf(id) === i);

export const audits: Audit[] = [
  {
    id: "aud-2026-01",
    number: "A-2026-01",
    programmeId: "prog-2026",
    title: "Internes Audit QM Produktion Chemnitz",
    type: "internal",
    status: "closed",
    siteId: "site-che",
    objectives: "Wirksamkeit der Produktionssteuerung und Prüfmittelüberwachung bewerten.",
    scopeDescription: "Produktion Oberflächenbehandlung und Prüfmittelmanagement, Werk Chemnitz",
    standardIds: ["std-9001"],
    requirementIds: ["req-9001-7.1.5", "req-9001-7.2", "req-9001-7.5", "req-9001-8.5.1", "req-9001-10.2"],
    processIds: ["proc-prod-che", "proc-pruef-che"],
    leadAuditorId: "p-keller",
    auditorIds: ["p-keller", "p-hoffmann"],
    auditeeIds: ["p-weber"],
    plannedStart: "2026-02-17",
    plannedEnd: "2026-02-18",
    actualStart: "2026-02-17",
    actualEnd: "2026-02-18",
    checklistId: "chk-2026-01",
    currentReportId: "rep-2026-01-v1",
    planningRationale: {
      riskLevel: "medium",
      reasons: ["Jährlicher Turnus", "Kundenreklamation zur Maßhaltigkeit im 4. Quartal 2025"],
    },
    warningOverrides: [],
  },
  {
    id: "aud-2026-03",
    number: "A-2026-03",
    programmeId: "prog-2026",
    title: "Überwachungsaudit ISO 9001 und 14001 Leipzig",
    type: "surveillance",
    status: "released",
    siteId: "site-lei",
    certificationBody: "CertoNorm GmbH (fiktiv)",
    objectives: "Zweites Überwachungsaudit im laufenden Zertifizierungszyklus.",
    scopeDescription: "Managementsystem, Produktion sowie Umwelt- und Arbeitsschutzorganisation, Werk Leipzig",
    standardIds: ["std-9001", "std-14001"],
    requirementIds: ["req-9001-7.5", "req-9001-8.5.1", "req-9001-9.2", "req-14001-6.1.3", "req-14001-9.1.2", "req-14001-8.1"],
    processIds: ["proc-mgmt", "proc-prod-lei", "proc-ehs-lei"],
    leadAuditorId: "p-meier",
    auditorIds: ["p-meier"],
    auditeeIds: ["p-koch", "p-keller"],
    plannedStart: "2026-05-05",
    plannedEnd: "2026-05-06",
    actualStart: "2026-05-05",
    actualEnd: "2026-05-06",
    currentReportId: "rep-2026-03-v1",
    planningRationale: {
      riskLevel: "medium",
      reasons: ["Termin durch Zertifizierungszyklus vorgegeben"],
    },
    warningOverrides: [],
  },
  {
    id: "aud-2026-05",
    number: "A-2026-05",
    programmeId: "prog-2026",
    title: "Internes Audit Energiemanagement Chemnitz",
    type: "internal",
    status: "released",
    siteId: "site-che",
    objectives: "Energetische Bewertung, EnPI und Energiedatensammlung prüfen.",
    scopeDescription: "Energiemanagement und Produktion Oberflächenbehandlung, Werk Chemnitz",
    standardIds: ["std-50001"],
    requirementIds: ["req-50001-6.3", "req-50001-6.4", "req-50001-6.6"],
    processIds: ["proc-energy", "proc-prod-che"],
    leadAuditorId: "p-keller",
    auditorIds: ["p-keller"],
    auditeeIds: ["p-hoffmann", "p-weber"],
    plannedStart: "2026-06-23",
    plannedEnd: "2026-06-23",
    actualStart: "2026-06-23",
    actualEnd: "2026-06-23",
    checklistId: "chk-2026-05",
    currentReportId: "rep-2026-05-v2",
    planningRationale: {
      riskLevel: "medium",
      reasons: ["Druckluft 2025 neu als wesentlicher Energieeinsatz eingestuft"],
    },
    warningOverrides: [],
  },
  {
    id: "aud-2026-07",
    number: "A-2026-07",
    programmeId: "prog-2026",
    title: "Lieferantenaudit Stahlhandel Ost",
    type: "supplier",
    status: "planned",
    siteId: null,
    supplierName: "Stahlhandel Ost GmbH (fiktiv)",
    objectives: "Qualitätsfähigkeit und Sorgfaltspflichten des neuen Hauptlieferanten für Coil-Material bewerten.",
    scopeDescription: "Wareneingangsprüfung, Rückverfolgbarkeit, Herkunftsnachweise",
    standardIds: ["std-9001"],
    requirementIds: ["req-9001-8.5.1", "req-9001-7.5"],
    processIds: ["proc-einkauf"],
    leadAuditorId: "p-keller",
    auditorIds: ["p-keller"],
    auditeeIds: [],
    plannedStart: "2026-11-10",
    plannedEnd: "2026-11-10",
    planningRationale: {
      riskLevel: "medium",
      reasons: ["Neuer Hauptlieferant", "LkSG-Risikoanalyse ergab mittleres Risiko"],
    },
    warningOverrides: [],
  },
  {
    id: "aud-2026-09",
    number: "A-2026-09",
    programmeId: "prog-2026",
    title: "Internes Kombi-Audit Umwelt und Arbeitsschutz Leipzig",
    type: "internal",
    status: "in_preparation",
    siteId: "site-lei",
    objectives: "Umsetzung von ISO 14001 und 45001 im Werk Leipzig bewerten, Schwerpunkt Intralogistik nach Umbau Halle 3.",
    scopeDescription: "Produktion, Intralogistik, Instandhaltung sowie Umwelt- und Arbeitsschutzorganisation, Werk Leipzig",
    standardIds: ["std-14001", "std-45001"],
    requirementIds: umasScope,
    processIds: ["proc-prod-lei", "proc-log-lei", "proc-inst-lei", "proc-ehs-lei"],
    leadAuditorId: "p-keller",
    // Demo: Wagner verantwortet Instandhaltung (im Scope) und ist nicht für ISO 45001 qualifiziert
    auditorIds: ["p-keller", "p-wagner"],
    auditeeIds: ["p-koch", "p-richter", "p-wagner"],
    plannedStart: "2026-10-08",
    plannedEnd: "2026-10-09",
    checklistId: "chk-2026-09",
    planningRationale: {
      riskLevel: "high",
      reasons: [
        "Umbau Halle 3 (Intralogistik) im 2. Quartal 2026",
        "Offene Nebenabweichung F-2026-004 aus dem Überwachungsaudit",
        "Zwei Beinaheunfälle mit Flurförderzeugen im 3. Quartal 2026",
      ],
    },
    warningOverrides: [],
  },
  {
    id: "aud-2026-10",
    number: "A-2026-10",
    programmeId: "prog-2026",
    title: "Internes Audit Arbeitsschutz Chemnitz",
    type: "internal",
    status: "planned",
    siteId: "site-che",
    objectives: "Gefährdungsbeurteilungen und Notfallorganisation in der Oberflächenbehandlung prüfen.",
    scopeDescription: "Produktion Oberflächenbehandlung, Werk Chemnitz",
    standardIds: ["std-45001"],
    requirementIds: ["req-45001-6.1.2", "req-45001-8.2", "req-45001-7.2", "req-45001-10.2"],
    processIds: ["proc-prod-che"],
    leadAuditorId: "p-brandt",
    auditorIds: ["p-brandt"],
    auditeeIds: ["p-weber"],
    plannedStart: "2026-11-17",
    plannedEnd: "2026-11-18",
    planningRationale: { riskLevel: "medium", reasons: ["Jährlicher Turnus", "Gefahrstoffe in der Oberflächenbehandlung"] },
    warningOverrides: [],
  },
  {
    id: "aud-2026-11",
    number: "A-2026-11",
    programmeId: "prog-2026",
    title: "Internes Audit QM Leipzig",
    type: "internal",
    status: "planned",
    siteId: "site-lei",
    objectives: "Produktionssteuerung und Lenkung dokumentierter Information prüfen.",
    scopeDescription: "Produktion Stanzen und Schweißen, Werk Leipzig",
    standardIds: ["std-9001"],
    requirementIds: ["req-9001-7.1.5", "req-9001-7.5", "req-9001-8.5.1", "req-9001-10.2"],
    processIds: ["proc-prod-lei"],
    leadAuditorId: "p-keller",
    auditorIds: ["p-keller", "p-hoffmann"],
    auditeeIds: ["p-koch"],
    plannedStart: "2026-12-08",
    plannedEnd: "2026-12-08",
    planningRationale: {
      riskLevel: "medium",
      reasons: [
        "Jährlicher Turnus",
        "Überwachungsaudit A-2026-03 (05/2026) ohne Abweichung zu ISO 9001 in Leipzig, nur ein Verbesserungspotenzial (F-2026-003)",
        "Kapitel 7.1.5 und 10.2 in Leipzig noch nie auditiert",
      ],
    },
    warningOverrides: [],
  },
];

export const planSlots: AuditPlanSlot[] = [
  { id: "slot-09-01", auditId: "aud-2026-09", start: "2026-10-08T08:00:00+02:00", end: "2026-10-08T08:30:00+02:00", topic: "Eröffnungsgespräch", location: "Besprechungsraum Verwaltung", requirementIds: [], participantIds: ["p-keller", "p-wagner", "p-koch", "p-richter"] },
  { id: "slot-09-02", auditId: "aud-2026-09", start: "2026-10-08T08:30:00+02:00", end: "2026-10-08T10:30:00+02:00", topic: "Rundgang Halle 3, Intralogistik und Lager", location: "Halle 3", processId: "proc-log-lei", requirementIds: ["req-45001-6.1.2", "req-45001-8.1.3", "req-45001-7.2"], participantIds: ["p-keller", "p-richter"] },
  { id: "slot-09-03", auditId: "aud-2026-09", start: "2026-10-08T10:45:00+02:00", end: "2026-10-08T12:15:00+02:00", topic: "Instandhaltung und Gefahrstofflager", location: "Werkstatt, Gefahrstofflager", processId: "proc-inst-lei", requirementIds: ["req-14001-8.1", "req-14001-6.1.2"], participantIds: ["p-keller", "p-wagner"] },
  { id: "slot-09-04", auditId: "aud-2026-09", start: "2026-10-08T13:00:00+02:00", end: "2026-10-08T15:00:00+02:00", topic: "Produktion Stanzen und Schweißen", location: "Halle 1", processId: "proc-prod-lei", requirementIds: ["req-45001-6.1.2", "req-45001-5.4", "req-14001-7.5"], participantIds: ["p-keller", "p-koch"] },
  { id: "slot-09-05", auditId: "aud-2026-09", start: "2026-10-09T08:00:00+02:00", end: "2026-10-09T10:00:00+02:00", topic: "Rechtskataster, Compliance-Bewertung, Notfallorganisation", location: "Büro Werkleitung", processId: "proc-ehs-lei", requirementIds: ["req-14001-6.1.3", "req-14001-9.1.2", "req-45001-9.1.2", "req-14001-8.2", "req-45001-8.2"], participantIds: ["p-keller", "p-koch"] },
  { id: "slot-09-06", auditId: "aud-2026-09", start: "2026-10-09T10:15:00+02:00", end: "2026-10-09T11:00:00+02:00", topic: "Vorfälle, Managementbewertung", location: "Büro Werkleitung", processId: "proc-ehs-lei", requirementIds: ["req-45001-10.2", "req-14001-9.3", "req-45001-9.3"], participantIds: ["p-keller", "p-koch"] },
  { id: "slot-09-07", auditId: "aud-2026-09", start: "2026-10-09T11:30:00+02:00", end: "2026-10-09T12:00:00+02:00", topic: "Abschlussgespräch", location: "Besprechungsraum Verwaltung", requirementIds: [], participantIds: ["p-keller", "p-wagner", "p-koch", "p-richter"] },
];

/* ------------------------------------------------------------------ */
/* Nachweise                                                           */
/* ------------------------------------------------------------------ */

const ev = (e: Omit<Evidence, "sha256">): Evidence => ({
  ...e,
  sha256: e.kind === "document_link" ? undefined : demoDigest(`${e.id}:${e.fileName ?? e.title}`),
});

export const evidence: Evidence[] = [
  ev({ id: "ev-01-01", auditId: "aud-2026-01", kind: "photo", title: "Bügelmessschraube PM-0412 mit abgelaufenem Prüfetikett", fileName: "pm-0412-pruefetikett.jpg", mimeType: "image/jpeg", sizeBytes: 1_842_311, capturedAt: "2026-02-17T10:12:00+01:00", uploadedById: "p-keller", uploadedAt: "2026-02-17T10:14:00+01:00", containsPersonalData: false }),
  ev({ id: "ev-01-02", auditId: "aud-2026-01", kind: "document_link", title: "Prüfmittelliste Chemnitz, Stand 02/2026", url: "dms://qm/pruefmittel/che-2026-02", capturedAt: "2026-02-17T10:20:00+01:00", uploadedById: "p-keller", uploadedAt: "2026-02-17T10:20:00+01:00", containsPersonalData: false }),
  ev({ id: "ev-01-03", auditId: "aud-2026-01", kind: "file", title: "CMMS-Auszug Kalibrierintervalle", fileName: "cmms-kalibrierung-2026-03.pdf", mimeType: "application/pdf", sizeBytes: 214_552, capturedAt: "2026-03-27T14:00:00+01:00", uploadedById: "p-weber", uploadedAt: "2026-03-27T14:05:00+01:00", containsPersonalData: false }),
  ev({ id: "ev-03-01", auditId: "aud-2026-03", kind: "file", title: "Auditbericht CertoNorm, Überwachungsaudit 2026", fileName: "certonorm-ueberwachungsaudit-2026.pdf", mimeType: "application/pdf", sizeBytes: 1_203_778, capturedAt: "2026-05-18T09:00:00+02:00", uploadedById: "p-keller", uploadedAt: "2026-05-20T08:45:00+02:00", containsPersonalData: false }),
  ev({ id: "ev-03-02", auditId: "aud-2026-03", kind: "file", title: "Compliance-Bewertung Leipzig 2026", fileName: "compliance-bewertung-lei-2026.pdf", mimeType: "application/pdf", sizeBytes: 388_120, capturedAt: "2026-06-26T15:00:00+02:00", uploadedById: "p-koch", uploadedAt: "2026-06-26T15:10:00+02:00", containsPersonalData: false }),
  ev({ id: "ev-05-01", auditId: "aud-2026-05", kind: "file", title: "Energiebericht 2025 Werk Chemnitz", fileName: "energiebericht-che-2025.pdf", mimeType: "application/pdf", sizeBytes: 2_440_901, capturedAt: "2026-06-23T09:30:00+02:00", uploadedById: "p-hoffmann", uploadedAt: "2026-06-20T11:00:00+02:00", containsPersonalData: false }),
  ev({ id: "ev-05-02", auditId: "aud-2026-05", kind: "interview_note", title: "Interviewnotiz Energiebeauftragte zur EnPI-Festlegung", capturedAt: "2026-06-23T11:00:00+02:00", uploadedById: "p-keller", uploadedAt: "2026-06-23T11:20:00+02:00", containsPersonalData: true, retentionUntil: "2029-06-30" }),
  ev({ id: "ev-05-03", auditId: "aud-2026-05", kind: "file", title: "EnPI-Liste mit Druckluft-Kennzahl und Baseline 2025", fileName: "enpi-liste-2026-08.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 48_210, capturedAt: "2026-08-19T10:00:00+02:00", uploadedById: "p-hoffmann", uploadedAt: "2026-08-19T10:02:00+02:00", containsPersonalData: false }),
  ev({ id: "ev-09-01", auditId: "aud-2026-09", kind: "document_link", title: "Gefährdungsbeurteilung Intralogistik Halle 3, Stand 11/2025", url: "dms://as/gbu/lei-halle3-2025-11", capturedAt: "2026-10-02T09:00:00+02:00", uploadedById: "p-richter", uploadedAt: "2026-10-02T09:00:00+02:00", containsPersonalData: false }),
  ev({ id: "ev-09-02", auditId: "aud-2026-09", kind: "document_link", title: "Rechtskataster Leipzig, Stand 06/2026", url: "dms://ehs/rechtskataster/lei-2026-06", capturedAt: "2026-10-01T14:30:00+02:00", uploadedById: "p-koch", uploadedAt: "2026-10-01T14:30:00+02:00", containsPersonalData: false }),
];

/* ------------------------------------------------------------------ */
/* Checklisten                                                         */
/* ------------------------------------------------------------------ */

const catalogById = (id: ID) => catalogs.find((c) => c.id === id)!;
const auditById = (id: ID) => audits.find((a) => a.id === id)!;

function rate(
  checklist: Checklist,
  itemId: ID,
  rating: ChecklistRating,
  by: ID,
  at: ISODateTime,
  extra: { notes?: string; evidenceIds?: ID[]; findingIds?: ID[] } = {},
) {
  const item = checklist.items.find((i) => i.id === itemId);
  if (!item) throw new Error(`Seed: Checklistenpunkt ${itemId} nicht gefunden`);
  Object.assign(item, {
    rating,
    ratedById: by,
    ratedAt: at,
    notes: extra.notes ?? "",
    evidenceIds: extra.evidenceIds ?? [],
    findingIds: extra.findingIds ?? [],
  });
}

const chk01 = createChecklistSnapshot({
  checklistId: "chk-2026-01",
  audit: auditById("aud-2026-01"),
  catalog: catalogById("cat-qm-v1"),
  carryOverFindings: [],
  actorId: "p-keller",
  now: "2026-02-10T09:00:00+01:00",
});
rate(chk01, "ci-2026-01-01", "deviation", "p-keller", "2026-02-17T10:15:00+01:00", { notes: "2 von 15 Stichproben mit überschrittenem Kalibrierdatum.", evidenceIds: ["ev-01-01", "ev-01-02"], findingIds: ["f-2026-001"] });
rate(chk01, "ci-2026-01-02", "conform", "p-keller", "2026-02-17T13:40:00+01:00", { notes: "SPC an Linie 2 in Schichtübergabe integriert.", findingIds: ["f-2026-002"] });
rate(chk01, "ci-2026-01-03", "conform", "p-hoffmann", "2026-02-17T14:30:00+01:00");
rate(chk01, "ci-2026-01-04", "conform", "p-keller", "2026-02-18T09:30:00+01:00", { notes: "Reklamation Maßhaltigkeit Q4/2025 per 8D bearbeitet." });
rate(chk01, "ci-2026-01-05", "conform", "p-hoffmann", "2026-02-18T10:15:00+01:00");

const chk05 = createChecklistSnapshot({
  checklistId: "chk-2026-05",
  audit: auditById("aud-2026-05"),
  catalog: catalogById("cat-enm-v1"),
  carryOverFindings: [],
  actorId: "p-keller",
  now: "2026-06-16T09:00:00+02:00",
});
rate(chk05, "ci-2026-05-01", "conform", "p-keller", "2026-06-23T09:45:00+02:00", { evidenceIds: ["ev-05-01"] });
rate(chk05, "ci-2026-05-02", "deviation", "p-keller", "2026-06-23T11:15:00+02:00", { notes: "Druckluft als SEU geführt, aber ohne EnPI.", evidenceIds: ["ev-05-02"], findingIds: ["f-2026-005"] });
rate(chk05, "ci-2026-05-03", "conform", "p-keller", "2026-06-23T13:00:00+02:00", { notes: "Halle 2 nur über Hauptzähler erfasst.", findingIds: ["f-2026-006"] });
rate(chk05, "ci-2026-05-04", "conform", "p-keller", "2026-06-23T13:30:00+02:00");

/** Demo-Audit: Snapshot von v3 plus Übernahme der offenen Nebenabweichung F-2026-004 */
const chk09 = createChecklistSnapshot({
  checklistId: "chk-2026-09",
  audit: auditById("aud-2026-09"),
  catalog: catalogById("cat-umas-v3"),
  carryOverFindings: findings.filter((f) => f.id === "f-2026-004"),
  actorId: "p-keller",
  now: "2026-09-29T10:00:00+02:00",
});
// Vorbereitende Dokumentenanforderung: Nachweise schon vor dem Audit am Punkt hinterlegt
chk09.items.find((i) => i.id === "ci-2026-09-04")!.evidenceIds = ["ev-09-01"];
chk09.items.find((i) => i.id === "ci-2026-09-05")!.evidenceIds = ["ev-09-02"];

export const checklists: Checklist[] = [chk01, chk05, chk09];
