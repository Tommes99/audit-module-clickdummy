/**
 * Simulierte KI-Vorschläge. Der Dummy ruft keine API auf.
 * UI zeigt einen Ladezustand von ca. 800 ms und danach den Vorschlag mit den Optionen
 * "Übernehmen", "Bearbeiten" und "Verwerfen". Jede Entscheidung erzeugt ein Event
 * mit aiGenerated = true (ai_suggestion_accepted bzw. ai_suggestion_rejected).
 */

export interface AiSuggestion {
  key: string;
  /** Wo der Vorschlag angeboten wird */
  context: "finding_text" | "root_cause" | "report_draft" | "risk_links";
  /** Eingabe, auf die der Vorschlag passt (für die Demo vorgegeben) */
  inputHint: string;
  output: Record<string, string | string[]>;
  /** Hinweis, der immer mit angezeigt wird */
  disclaimer: string;
}

const DISCLAIMER = "KI-Vorschlag. Bitte fachlich prüfen, die Verantwortung für den Inhalt bleibt bei Ihnen.";

export const aiSuggestions: AiSuggestion[] = [
  {
    key: "finding-gbu-halle3",
    context: "finding_text",
    inputHint: "GBU Halle 3 Stand 11/25, Umbau Q2/26, neue Regalgassen, Fußgängerwege nicht markiert, 2 Beinaheunfälle Q3",
    output: {
      title: "Gefährdungsbeurteilung Intralogistik Halle 3 nach Umbau nicht aktualisiert",
      description:
        "Die Gefährdungsbeurteilung für die Intralogistik in Halle 3 hat den Stand 11/2025. Der Umbau mit geänderter Regalanordnung erfolgte im 2. Quartal 2026. Die geänderte Verkehrsführung zwischen Flurförderzeugen und Fußgänger:innen ist nicht bewertet, Fußgängerwege sind in zwei Gassen nicht markiert. Im 3. Quartal 2026 wurden zwei Beinaheunfälle mit Flurförderzeugen gemeldet. Ein anlassbezogener Prüfschritt für die Gefährdungsbeurteilung bei baulichen Änderungen ist im Änderungsprozess nicht vorgesehen.",
    },
    disclaimer: DISCLAIMER,
  },
  {
    key: "links-gbu-halle3",
    context: "risk_links",
    inputHint: "Gleicher Prozess (Intralogistik Leipzig) und Standort",
    output: {
      riskIds: ["risk-012"],
      kpiIds: ["kpi-as-02"],
      rationale: "R-012 betrifft denselben Prozess und Bereich. KPI-AS-02 erfasst Beinaheunfälle mit Flurförderzeugen am Standort.",
    },
    disclaimer: DISCLAIMER,
  },
  {
    key: "rca-gbu-halle3",
    context: "root_cause",
    inputHint: "5-Why für F-2026-007",
    output: {
      steps: [
        "Warum wurde die Gefährdungsbeurteilung nicht aktualisiert? Der Umbau wurde nicht als Anlass erkannt.",
        "Warum nicht? Der Bauantrag lief über die Instandhaltung, die Fachkraft für Arbeitssicherheit war nicht eingebunden.",
        "Warum nicht? Im Änderungsprozess fehlt ein Pflichtschritt zur Prüfung von Arbeitsschutzauswirkungen.",
      ],
      rootCause: "Änderungsprozess ohne verpflichtende Prüfung der Arbeitsschutzauswirkungen (Management von Veränderungen).",
    },
    disclaimer: DISCLAIMER,
  },
  {
    key: "report-a-2026-09",
    context: "report_draft",
    inputHint: "Berichtsentwurf aus Checkliste, Feststellungen und Auditplan A-2026-09",
    output: {
      summary:
        "Internes Kombi-Audit nach ISO 14001 und ISO 45001 im Werk Leipzig am 8. und 9.10.2026. Geprüft wurden 13 Checklistenpunkte in Produktion, Intralogistik, Instandhaltung sowie Umwelt- und Arbeitsschutzorganisation.",
      conclusion:
        "Das integrierte Managementsystem ist am Standort umgesetzt. Handlungsbedarf besteht beim Management von Veränderungen: Bauliche Änderungen lösen bisher keine Überprüfung der Gefährdungsbeurteilung aus.",
      strengths: ["Rechtskataster aktuell und vollständig", "Hohe Beteiligung der Beschäftigten bei Begehungen"],
    },
    disclaimer: DISCLAIMER,
  },
];
