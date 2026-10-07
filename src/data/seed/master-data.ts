import type { Kpi, Organisation, Person, Process, Requirement, Risk, Site, Standard } from "@/types/domain";

/**
 * Fiktives Demo-Unternehmen. Alle Namen, Personen und Organisationen sind erfunden.
 */

export const organisation: Organisation = {
  id: "org-mm",
  name: "Muster Metall GmbH",
  industry: "Metallverarbeitung (Stanz- und Schweißbaugruppen)",
};

export const sites: Site[] = [
  {
    id: "site-lei",
    organisationId: "org-mm",
    name: "Werk Leipzig",
    city: "Leipzig",
    certifiedStandardIds: ["std-9001", "std-14001", "std-45001"],
  },
  {
    id: "site-che",
    organisationId: "org-mm",
    name: "Werk Chemnitz",
    city: "Chemnitz",
    certifiedStandardIds: ["std-9001", "std-14001", "std-45001", "std-50001"],
  },
];

const mail = (local: string) => `${local}@muster-metall.example`;

export const persons: Person[] = [
  {
    id: "p-schulz",
    name: "Petra Schulz",
    jobTitle: "Geschäftsführerin",
    email: mail("p.schulz"),
    siteId: null,
    roles: ["management"],
    auditorQualifications: [],
    isExternal: false,
  },
  {
    id: "p-keller",
    name: "Sandra Keller",
    jobTitle: "Leiterin Integriertes Managementsystem",
    email: mail("s.keller"),
    siteId: null,
    roles: ["programme_manager", "auditor"],
    auditorQualifications: ["std-9001", "std-14001", "std-45001", "std-50001"],
    isExternal: false,
  },
  {
    id: "p-brandt",
    name: "Jonas Brandt",
    jobTitle: "Fachkraft für Arbeitssicherheit",
    email: mail("j.brandt"),
    siteId: null,
    roles: ["auditor"],
    auditorQualifications: ["std-14001", "std-45001"],
    isExternal: false,
  },
  {
    id: "p-wagner",
    name: "Michael Wagner",
    jobTitle: "Leiter Instandhaltung Leipzig",
    email: mail("m.wagner"),
    siteId: "site-lei",
    roles: ["auditor", "auditee", "action_owner"],
    auditorQualifications: ["std-9001", "std-14001"],
    isExternal: false,
  },
  {
    id: "p-koch",
    name: "Kerstin Koch",
    jobTitle: "Werkleiterin Leipzig",
    email: mail("k.koch"),
    siteId: "site-lei",
    roles: ["auditee", "action_owner"],
    auditorQualifications: [],
    isExternal: false,
  },
  {
    id: "p-richter",
    name: "Thomas Richter",
    jobTitle: "Leiter Logistik Leipzig",
    email: mail("t.richter"),
    siteId: "site-lei",
    roles: ["auditee", "action_owner"],
    auditorQualifications: [],
    isExternal: false,
  },
  {
    id: "p-demir",
    name: "Aylin Demir",
    jobTitle: "Schichtleiterin Lager Leipzig",
    email: mail("a.demir"),
    siteId: "site-lei",
    roles: ["action_owner"],
    auditorQualifications: [],
    isExternal: false,
  },
  {
    id: "p-hoffmann",
    name: "Lena Hoffmann",
    jobTitle: "Energie- und Umweltbeauftragte Chemnitz",
    email: mail("l.hoffmann"),
    siteId: "site-che",
    roles: ["auditor", "auditee", "action_owner"],
    auditorQualifications: ["std-14001", "std-50001", "std-9001"],
    isExternal: false,
  },
  {
    id: "p-weber",
    name: "Stefan Weber",
    jobTitle: "Werkleiter Chemnitz",
    email: mail("s.weber"),
    siteId: "site-che",
    roles: ["auditee", "action_owner"],
    auditorQualifications: [],
    isExternal: false,
  },
  {
    id: "p-meier",
    name: "Dr. Frank Meier",
    jobTitle: "Leitender Auditor",
    email: "f.meier@certonorm.example",
    siteId: null,
    roles: ["auditor"],
    auditorQualifications: ["std-9001", "std-14001", "std-45001"],
    isExternal: true,
    externalOrganisation: "CertoNorm GmbH (fiktive Zertifizierungsstelle)",
  },
];

export const processes: Process[] = [
  { id: "proc-mgmt", name: "Managementsystem und Führung", category: "management", siteIds: ["site-lei", "site-che"], ownerId: "p-keller" },
  { id: "proc-einkauf", name: "Einkauf und Lieferantenmanagement", category: "support", siteIds: ["site-lei", "site-che"], ownerId: "p-schulz" },
  { id: "proc-energy", name: "Energiemanagement", category: "support", siteIds: ["site-lei", "site-che"], ownerId: "p-hoffmann" },
  { id: "proc-prod-lei", name: "Produktion Leipzig (Stanzen, Schweißen)", category: "core", siteIds: ["site-lei"], ownerId: "p-koch" },
  { id: "proc-log-lei", name: "Intralogistik und Lager Leipzig", category: "core", siteIds: ["site-lei"], ownerId: "p-richter" },
  { id: "proc-inst-lei", name: "Instandhaltung Leipzig", category: "support", siteIds: ["site-lei"], ownerId: "p-wagner" },
  { id: "proc-ehs-lei", name: "Umwelt- und Arbeitsschutzorganisation Leipzig", category: "support", siteIds: ["site-lei"], ownerId: "p-koch" },
  { id: "proc-prod-che", name: "Produktion Chemnitz (Oberflächenbehandlung)", category: "core", siteIds: ["site-che"], ownerId: "p-weber" },
  { id: "proc-pruef-che", name: "Prüfmittelmanagement Chemnitz", category: "support", siteIds: ["site-che"], ownerId: "p-weber" },
];

export const standards: Standard[] = [
  { id: "std-9001", code: "ISO 9001", edition: "2015", title: "Qualitätsmanagementsysteme", shortLabel: "QM" },
  { id: "std-14001", code: "ISO 14001", edition: "2015", title: "Umweltmanagementsysteme", shortLabel: "UM" },
  { id: "std-45001", code: "ISO 45001", edition: "2018", title: "Managementsysteme für Sicherheit und Gesundheit bei der Arbeit", shortLabel: "AS" },
  { id: "std-50001", code: "ISO 50001", edition: "2018", title: "Energiemanagementsysteme", shortLabel: "EnM" },
];

/**
 * Auswahl relevanter Kapitel. Titel sind sinngemäße Kurztitel, kein Normtext.
 * harmonizedKey nur bei gemeinsamem HS-Text, relatedRequirementIds für kuratierte Paare.
 */
export const requirements: Requirement[] = [
  // ISO 9001:2015
  { id: "req-9001-5.2", standardId: "std-9001", clause: "5.2", title: "Qualitätspolitik", harmonizedKey: "policy" },
  { id: "req-9001-7.1.5", standardId: "std-9001", clause: "7.1.5", title: "Ressourcen zur Überwachung und Messung" },
  { id: "req-9001-7.2", standardId: "std-9001", clause: "7.2", title: "Kompetenz", harmonizedKey: "competence" },
  { id: "req-9001-7.5", standardId: "std-9001", clause: "7.5", title: "Dokumentierte Information", harmonizedKey: "documented_information" },
  { id: "req-9001-8.5.1", standardId: "std-9001", clause: "8.5.1", title: "Steuerung der Produktion" },
  { id: "req-9001-9.2", standardId: "std-9001", clause: "9.2", title: "Internes Audit", harmonizedKey: "internal_audit" },
  { id: "req-9001-9.3", standardId: "std-9001", clause: "9.3", title: "Managementbewertung", harmonizedKey: "management_review" },
  { id: "req-9001-10.2", standardId: "std-9001", clause: "10.2", title: "Nichtkonformität und Korrekturmaßnahmen", harmonizedKey: "nonconformity_corrective_action" },

  // ISO 14001:2015
  { id: "req-14001-5.2", standardId: "std-14001", clause: "5.2", title: "Umweltpolitik", harmonizedKey: "policy" },
  { id: "req-14001-6.1.2", standardId: "std-14001", clause: "6.1.2", title: "Umweltaspekte" },
  { id: "req-14001-6.1.3", standardId: "std-14001", clause: "6.1.3", title: "Bindende Verpflichtungen", relatedRequirementIds: ["req-45001-6.1.3"] },
  { id: "req-14001-7.2", standardId: "std-14001", clause: "7.2", title: "Kompetenz", harmonizedKey: "competence" },
  { id: "req-14001-7.5", standardId: "std-14001", clause: "7.5", title: "Dokumentierte Information", harmonizedKey: "documented_information" },
  { id: "req-14001-8.1", standardId: "std-14001", clause: "8.1", title: "Betriebliche Planung und Steuerung", harmonizedKey: "operational_planning_control" },
  { id: "req-14001-8.2", standardId: "std-14001", clause: "8.2", title: "Notfallvorsorge und Gefahrenabwehr", relatedRequirementIds: ["req-45001-8.2"] },
  { id: "req-14001-9.1.2", standardId: "std-14001", clause: "9.1.2", title: "Bewertung der Einhaltung von Verpflichtungen", relatedRequirementIds: ["req-45001-9.1.2"] },
  { id: "req-14001-9.2", standardId: "std-14001", clause: "9.2", title: "Internes Audit", harmonizedKey: "internal_audit" },
  { id: "req-14001-9.3", standardId: "std-14001", clause: "9.3", title: "Managementbewertung", harmonizedKey: "management_review" },
  { id: "req-14001-10.2", standardId: "std-14001", clause: "10.2", title: "Nichtkonformität und Korrekturmaßnahmen", harmonizedKey: "nonconformity_corrective_action" },

  // ISO 45001:2018
  { id: "req-45001-5.2", standardId: "std-45001", clause: "5.2", title: "SGA-Politik", harmonizedKey: "policy" },
  { id: "req-45001-5.4", standardId: "std-45001", clause: "5.4", title: "Konsultation und Beteiligung der Beschäftigten" },
  { id: "req-45001-6.1.2", standardId: "std-45001", clause: "6.1.2", title: "Gefährdungsermittlung und Bewertung von Risiken und Chancen" },
  { id: "req-45001-6.1.3", standardId: "std-45001", clause: "6.1.3", title: "Rechtliche Verpflichtungen und andere Anforderungen" },
  { id: "req-45001-7.2", standardId: "std-45001", clause: "7.2", title: "Kompetenz", harmonizedKey: "competence" },
  { id: "req-45001-7.5", standardId: "std-45001", clause: "7.5", title: "Dokumentierte Information", harmonizedKey: "documented_information" },
  { id: "req-45001-8.1.3", standardId: "std-45001", clause: "8.1.3", title: "Management von Veränderungen" },
  { id: "req-45001-8.2", standardId: "std-45001", clause: "8.2", title: "Notfallvorsorge und Gefahrenabwehr" },
  { id: "req-45001-9.1.2", standardId: "std-45001", clause: "9.1.2", title: "Bewertung der Einhaltung von Verpflichtungen" },
  { id: "req-45001-9.2", standardId: "std-45001", clause: "9.2", title: "Internes Audit", harmonizedKey: "internal_audit" },
  { id: "req-45001-9.3", standardId: "std-45001", clause: "9.3", title: "Managementbewertung", harmonizedKey: "management_review" },
  { id: "req-45001-10.2", standardId: "std-45001", clause: "10.2", title: "Vorfälle, Nichtkonformitäten und Korrekturmaßnahmen", harmonizedKey: "nonconformity_corrective_action" },

  // ISO 50001:2018
  { id: "req-50001-5.2", standardId: "std-50001", clause: "5.2", title: "Energiepolitik", harmonizedKey: "policy" },
  { id: "req-50001-6.3", standardId: "std-50001", clause: "6.3", title: "Energetische Bewertung" },
  { id: "req-50001-6.4", standardId: "std-50001", clause: "6.4", title: "Energieleistungskennzahlen (EnPI)" },
  { id: "req-50001-6.6", standardId: "std-50001", clause: "6.6", title: "Planung der Energiedatensammlung" },
  { id: "req-50001-9.2", standardId: "std-50001", clause: "9.2", title: "Internes Audit", harmonizedKey: "internal_audit" },
  { id: "req-50001-9.3", standardId: "std-50001", clause: "9.3", title: "Managementbewertung", harmonizedKey: "management_review" },
  // Achtung: in ISO 50001:2018 ist Nichtkonformität Kap. 10.1, nicht 10.2
  { id: "req-50001-10.1", standardId: "std-50001", clause: "10.1", title: "Nichtkonformität und Korrekturmaßnahmen", harmonizedKey: "nonconformity_corrective_action" },
];

/** Aus dem GRC-Modul, im Dummy nur lesend */
export const risks: Risk[] = [
  {
    id: "risk-012",
    code: "R-012",
    title: "Kollision Flurförderzeug mit Fußgänger:innen in Halle 3",
    siteId: "site-lei",
    processId: "proc-log-lei",
    likelihood: 3,
    severity: 5,
    ownerId: "p-richter",
    sourceModule: "grc",
  },
  {
    id: "risk-008",
    code: "R-008",
    title: "Unvollständige Erfüllung umwelt- und arbeitsschutzrechtlicher Pflichten am Standort Leipzig",
    siteId: "site-lei",
    processId: "proc-ehs-lei",
    likelihood: 2,
    severity: 4,
    ownerId: "p-koch",
    sourceModule: "grc",
  },
  {
    id: "risk-015",
    code: "R-015",
    title: "Energieverluste durch Druckluftleckagen",
    siteId: "site-che",
    processId: "proc-energy",
    likelihood: 4,
    severity: 2,
    ownerId: "p-hoffmann",
    sourceModule: "grc",
  },
];

/** Aus den ESG/EHS-Datenmodulen, im Dummy nur lesend */
export const kpis: Kpi[] = [
  { id: "kpi-as-01", code: "KPI-AS-01", name: "Meldepflichtige Arbeitsunfälle", unit: "Anzahl", esrsTopic: "S1", module: "ehs", latestValue: 3, period: "Jan. bis Sep. 2026" },
  { id: "kpi-as-02", code: "KPI-AS-02", name: "Beinaheunfälle mit Flurförderzeugen", unit: "Anzahl", esrsTopic: "S1", module: "ehs", latestValue: 2, period: "3. Quartal 2026" },
  { id: "kpi-en-01", code: "KPI-EN-01", name: "Spezifischer Druckluftverbrauch", unit: "kWh/Nm³", esrsTopic: "E1", module: "energy", latestValue: 0.118, period: "2. Quartal 2026" },
];
