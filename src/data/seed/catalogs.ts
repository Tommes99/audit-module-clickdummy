import type { CatalogQuestion, QuestionCatalog } from "@/types/domain";

/**
 * Fragen sind eigene Formulierungen, keine Normzitate.
 * Kombi-Katalog UM/AS liegt in zwei Versionen vor, um Versionierung zu zeigen:
 * v3 ergänzt die Frage zum Management von Veränderungen.
 */

const umasV3Questions: CatalogQuestion[] = [
  {
    id: "cq-umas3-01",
    text: "Ist die Umwelt- und SGA-Politik am Standort bekannt und für Beschäftigte zugänglich?",
    evidenceHint: "Aushang, Intranet, Stichproben-Interviews",
    requirementIds: ["req-14001-5.2", "req-45001-5.2"],
  },
  {
    id: "cq-umas3-02",
    text: "Sind die bedeutenden Umweltaspekte des Standorts ermittelt, bewertet und aktuell?",
    evidenceHint: "Umweltaspekte-Register, Bewertungskriterien, Datum der letzten Überprüfung",
    requirementIds: ["req-14001-6.1.2"],
  },
  {
    id: "cq-umas3-03",
    text: "Liegen für alle Arbeitsbereiche aktuelle Gefährdungsbeurteilungen vor?",
    evidenceHint: "Gefährdungsbeurteilungen je Bereich, Freigabedatum, Maßnahmenstatus",
    requirementIds: ["req-45001-6.1.2"],
  },
  {
    id: "cq-umas3-04",
    text: "Werden Gefährdungsbeurteilungen bei Änderungen an Arbeitsstätten, Abläufen oder Anlagen anlassbezogen aktualisiert?",
    guidance: "Änderungen der letzten 12 Monate erfragen (Umbauten, neue Anlagen, Layoutänderungen) und gegen das Datum der Gefährdungsbeurteilung prüfen.",
    evidenceHint: "Änderungsanträge, Baumaßnahmen, Gefährdungsbeurteilung mit Revisionsstand",
    requirementIds: ["req-45001-6.1.2", "req-45001-8.1.3"],
  },
  {
    id: "cq-umas3-05",
    text: "Ist das Rechtskataster vollständig und wird die Einhaltung der Verpflichtungen regelmäßig bewertet?",
    evidenceHint: "Rechtskataster mit Stand, dokumentierte Compliance-Bewertung",
    requirementIds: ["req-14001-6.1.3", "req-14001-9.1.2", "req-45001-6.1.3", "req-45001-9.1.2"],
  },
  {
    id: "cq-umas3-06",
    text: "Werden Beschäftigte bei der Gefährdungsermittlung und der Festlegung von Maßnahmen beteiligt?",
    evidenceHint: "ASA-Protokolle, Beteiligung Betriebsrat, Begehungsprotokolle",
    requirementIds: ["req-45001-5.4"],
  },
  {
    id: "cq-umas3-07",
    text: "Werden Tätigkeiten mit bedeutenden Umweltaspekten, etwa Gefahrstofflagerung, betrieblich gesteuert?",
    evidenceHint: "Betriebsanweisungen, Auffangwannen, Lagerliste, Begehung",
    requirementIds: ["req-14001-8.1"],
  },
  {
    id: "cq-umas3-08",
    text: "Sind Notfallszenarien ermittelt, Notfallpläne aktuell und Übungen durchgeführt?",
    evidenceHint: "Notfallplan, Übungsprotokolle, Auswertung der letzten Übung",
    requirementIds: ["req-14001-8.2", "req-45001-8.2"],
  },
  {
    id: "cq-umas3-09",
    text: "Sind Qualifikations- und Unterweisungsnachweise für sicherheitsrelevante Tätigkeiten vollständig?",
    guidance: "Stichprobe: Fahrberechtigungen Flurförderzeuge, Unterweisungen Gefahrstoffe.",
    evidenceHint: "Qualifikationsmatrix, Unterweisungsnachweise, Fahraufträge",
    requirementIds: ["req-14001-7.2", "req-45001-7.2"],
  },
  {
    id: "cq-umas3-10",
    text: "Wird dokumentierte Information gelenkt, also freigegeben, versioniert und am Arbeitsplatz verfügbar?",
    evidenceHint: "Dokumentenlenkung, Stichprobe Arbeitsplatz",
    requirementIds: ["req-14001-7.5", "req-45001-7.5"],
  },
  {
    id: "cq-umas3-11",
    text: "Werden Vorfälle und Beinaheunfälle erfasst, untersucht und Korrekturmaßnahmen abgeleitet?",
    evidenceHint: "Unfall- und Beinaheunfallmeldungen, Untersuchungsberichte",
    requirementIds: ["req-45001-10.2", "req-14001-10.2"],
  },
  {
    id: "cq-umas3-12",
    text: "Werden Ergebnisse interner Audits und offene Maßnahmen in der Managementbewertung behandelt?",
    evidenceHint: "Protokoll Managementbewertung, Maßnahmenliste",
    requirementIds: ["req-14001-9.3", "req-45001-9.3"],
  },
];

/** v2 = v3 ohne die Frage zum Management von Veränderungen */
const umasV2Questions: CatalogQuestion[] = umasV3Questions
  .filter((q) => q.id !== "cq-umas3-04")
  .map((q, i) => ({ ...q, id: `cq-umas2-${String(i + 1).padStart(2, "0")}` }));

export const catalogs: QuestionCatalog[] = [
  {
    id: "cat-umas-v2",
    key: "kombi-um-as-produktion",
    name: "Kombi-Audit Umwelt und Arbeitsschutz, Produktion",
    version: 2,
    status: "retired",
    standardIds: ["std-14001", "std-45001"],
    releasedAt: "2025-01-20T10:00:00+01:00",
    releasedById: "p-keller",
    questions: umasV2Questions,
  },
  {
    id: "cat-umas-v3",
    key: "kombi-um-as-produktion",
    name: "Kombi-Audit Umwelt und Arbeitsschutz, Produktion",
    version: 3,
    status: "released",
    standardIds: ["std-14001", "std-45001"],
    releasedAt: "2026-07-15T09:00:00+02:00",
    releasedById: "p-keller",
    supersedesCatalogId: "cat-umas-v2",
    changeNote: "Frage zum Management von Veränderungen ergänzt (ISO 45001 Kap. 8.1.3), Anlass: Umbauten im Werk Leipzig.",
    questions: umasV3Questions,
  },
  {
    id: "cat-qm-v1",
    key: "qm-produktion",
    name: "Qualitätsmanagement Produktion",
    version: 1,
    status: "released",
    standardIds: ["std-9001"],
    releasedAt: "2025-01-20T10:00:00+01:00",
    releasedById: "p-keller",
    questions: [
      {
        id: "cq-qm1-01",
        text: "Sind Prüfmittel identifiziert, kalibriert und ist der Kalibrierstatus am Prüfmittel erkennbar?",
        evidenceHint: "Prüfmittelliste, Kalibrierzertifikate, Stichprobe vor Ort",
        requirementIds: ["req-9001-7.1.5"],
      },
      {
        id: "cq-qm1-02",
        text: "Werden Produktionsprozesse unter beherrschten Bedingungen durchgeführt, etwa mit Arbeitsanweisungen und Prüfplänen?",
        evidenceHint: "Arbeitsanweisungen, Prüfpläne, SPC-Auswertungen",
        requirementIds: ["req-9001-8.5.1"],
      },
      {
        id: "cq-qm1-03",
        text: "Ist dokumentierte Information am Arbeitsplatz aktuell und freigegeben?",
        evidenceHint: "Stichprobe Arbeitsplatz gegen Dokumentenlenkung",
        requirementIds: ["req-9001-7.5"],
      },
      {
        id: "cq-qm1-04",
        text: "Werden Reklamationen systematisch analysiert und Korrekturmaßnahmen abgeleitet?",
        evidenceHint: "Reklamationsliste, 8D-Berichte",
        requirementIds: ["req-9001-10.2"],
      },
      {
        id: "cq-qm1-05",
        text: "Sind Kompetenzanforderungen für Prüftätigkeiten festgelegt und nachgewiesen?",
        evidenceHint: "Qualifikationsmatrix Prüfpersonal",
        requirementIds: ["req-9001-7.2"],
      },
    ],
  },
  {
    id: "cat-enm-v1",
    key: "enm-standort",
    name: "Energiemanagement Standort",
    version: 1,
    status: "released",
    standardIds: ["std-50001"],
    releasedAt: "2025-03-03T10:00:00+01:00",
    releasedById: "p-keller",
    questions: [
      {
        id: "cq-enm1-01",
        text: "Ist die energetische Bewertung aktuell und sind die wesentlichen Energieeinsätze bestimmt?",
        evidenceHint: "Energetische Bewertung, Liste der wesentlichen Energieeinsätze (SEU)",
        requirementIds: ["req-50001-6.3"],
      },
      {
        id: "cq-enm1-02",
        text: "Sind für alle wesentlichen Energieeinsätze Energieleistungskennzahlen festgelegt?",
        evidenceHint: "EnPI-Liste mit Baseline, Zuordnung zu SEU",
        requirementIds: ["req-50001-6.4"],
      },
      {
        id: "cq-enm1-03",
        text: "Ist ein Plan zur Energiedatensammlung vorhanden und wird er umgesetzt?",
        evidenceHint: "Messkonzept, Zählerstruktur, Datenqualität",
        requirementIds: ["req-50001-6.6"],
      },
      {
        id: "cq-enm1-04",
        text: "Werden Einsparpotenziale bewertet und priorisiert?",
        evidenceHint: "Maßnahmenliste mit Bewertung, Wirtschaftlichkeitsrechnung",
        requirementIds: ["req-50001-6.3"],
      },
    ],
  },
];
