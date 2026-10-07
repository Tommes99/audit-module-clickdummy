import type { ID } from "@/types/domain";

/** Schritte des Demo-Rundgangs (CLAUDE.md Abschnitt 14), als Leitfaden in der Seitenleiste */
export interface TourStep {
  id: string;
  title: string;
  text: string;
  /** Persona, mit der der Schritt gezeigt wird */
  personId: ID;
  href: string;
}

export const tourSteps: TourStep[] = [
  { id: "aufgaben", title: "Meine Aufgaben", text: "A-2026-09 erscheint mit zwei Konflikten im Auditteam.", personId: "p-keller", href: "/" },
  { id: "matrix", title: "Abdeckungsmatrix", text: "ISO 45001 8.1.3 in Leipzig ist noch nie auditiert.", personId: "p-keller", href: "/programm?tab=abdeckung" },
  { id: "start", title: "Audit vorbereiten", text: "Konflikt lösen: Michael Wagner entfernen, Jonas Brandt hinzufügen, Audit starten.", personId: "p-keller", href: "/audits/aud-2026-09" },
  { id: "checkliste", title: "Checkliste und Feststellung", text: "Punkt 4 als Abweichung bewerten und eine Feststellung anlegen. Die Bezüge sind vorbefüllt.", personId: "p-keller", href: "/audits/aud-2026-09?tab=checkliste" },
  { id: "verlauf", title: "Verlauf des Audits", text: "Jede Aktion mit Person, Rolle, Zeit und Hash. KI-Einträge sind markiert.", personId: "p-keller", href: "/audits/aud-2026-09?tab=verlauf" },
  { id: "annehmen", title: "Feststellung annehmen", text: "Als Thomas Richter annehmen, Ursachenanalyse, Korrektur und Korrekturmaßnahme anlegen.", personId: "p-richter", href: "/" },
  { id: "bericht", title: "Bericht freigeben", text: "Übrige Punkte per Demo-Abkürzung konform setzen, Bericht erzeugen und freigeben.", personId: "p-keller", href: "/audits/aud-2026-09?tab=bericht" },
  { id: "versionen", title: "Berichtsversionen", text: "A-2026-05 zeigt Version 1 und 2 im Vergleich.", personId: "p-keller", href: "/audits/aud-2026-05?tab=bericht" },
  { id: "wirksamkeit", title: "Vier-Augen-Prinzip", text: "F-2026-005: Prüfung durchführen. Schließen bleibt gesperrt, bis eine zweite Person bestätigt.", personId: "p-keller", href: "/feststellungen/f-2026-005" },
  { id: "integritaet", title: "Integrität prüfen", text: "Der globale Verlauf meldet eine lückenlose Kette.", personId: "p-keller", href: "/verlauf" },
  { id: "kataloge", title: "Kataloge und Mapping", text: "ISO 45001 10.2 öffnen und gleichwertige Anforderungen zeigen.", personId: "p-keller", href: "/kataloge/cat-umas-v3?tab=mapping" },
];
