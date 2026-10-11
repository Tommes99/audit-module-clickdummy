/**
 * Hilfetexte hinter dem "?" (Komponente HelpHint). Einzige Quelle für erklärende Texte,
 * damit die Seiten selbst ruhig bleiben. Regeln: höchstens zwei, drei kurze Sätze, keine Normtexte
 * (nur Kapitelnummer und Kurztitel), keine Gedankenstriche. Fachliche Grundlage: CLAUDE.md Abschnitte 4 bis 7.
 */

export interface HelpTopicDef {
  title: string;
  body: string;
  /** Kurze Stichpunkte unter dem Text, z. B. Begriffe oder Schritte */
  points?: readonly string[];
}

export const helpTopics = {
  /* Shell */
  "shell.demo": {
    title: "Demo mit fiktiven Daten",
    body: "Alle Daten sind erfunden (Muster Metall GmbH). Das Demo-Datum ist fest auf den 08.10.2026 gesetzt, damit Fristen bei jeder Vorführung gleich wirken. Änderungen bleiben nur in diesem Browser.",
  },
  "shell.role": {
    title: "Rollenwechsel ohne Login",
    body: "Wechseln Sie die Rolle, um dieselben Daten aus Sicht einer anderen Person zu sehen. Startseite, Buttons und Rechte passen sich an.",
  },
  "shell.search": {
    title: "Schnellsuche",
    body: "Springt zu Audits, Feststellungen, Maßnahmen, Katalogen und Seiten. Tastenkürzel: Strg K oder Cmd K.",
  },

  /* Meine Aufgaben */
  "home.tasks": {
    title: "Meine Aufgaben",
    body: "Zeigt nur, was für Ihre aktuelle Rolle zu tun ist. Ein Klick führt direkt zum Objekt. Blocker und Warnungen stehen gleich am Eintrag.",
  },
  "home.programme": {
    title: "Programmstatus",
    body: "Verdichtete Sicht auf das Auditprogramm des Jahres. Die Zahlen werden aus dem Datenbestand berechnet, nicht gespeichert.",
  },

  /* Programm */
  "programme.page": {
    title: "Auditprogramm",
    body: "Die risikobasierte Jahresplanung aller Audits (ISO 19011 Kapitel 5). Der Jahresplan listet die Audits, die Abdeckungsmatrix zeigt, welche Normkapitel an welchem Standort geprüft sind.",
  },
  "programme.plan": {
    title: "Jahresplan",
    body: "Alle Audits des Programms nach Monat. Mit dem Pfeil vor der Zeile klappen Sie die Kurzinfo auf, ein Klick auf die Nummer öffnet das Audit.",
  },
  "programme.create": {
    title: "Audit planen",
    body: "Ziele, Umfang und Normen legen fest, was geprüft wird. Die Risikoeinstufung mit Begründung macht die Planung nachvollziehbar (ISO 19011 Kapitel 5). Das Audit startet im Status Geplant.",
    points: [
      "Anforderungen im Scope: alle Kapitel der gewählten Normen",
      "Auditees: Verantwortliche der gewählten Prozesse",
      "Team, Checkliste und Konflikte folgen in der Vorbereitung",
    ],
  },
  "programme.risk": {
    title: "Risikoeinstufung",
    body: "Sie steuert, wie dringend ein Audit ist. Die Begründung steht im Audit unter Übersicht und Plan.",
  },
  "programme.coverage": {
    title: "Abdeckungsmatrix",
    body: "Jede Zelle zeigt für ein Normkapitel an einem Standort, wann es zuletzt auditiert wurde und welches Audit es als Nächstes abdeckt. Lücken sind damit auf einen Blick sichtbar.",
    points: ["Gleichwertige Kapitel verschiedener Normen zählen gemeinsam (Harmonized Structure)", "Ein Klick auf eine Zelle zeigt die Details"],
  },

  /* Audit */
  "audit.workflow": {
    title: "Ablauf eines Audits",
    body: "Geplant, In Vorbereitung, In Durchführung, Berichtserstellung, Bericht freigegeben, Abgeschlossen (nach ISO 19011). Ein Button ist nur aktiv, wenn alle Bedingungen erfüllt sind.",
    points: ["Blocker verhindern den Wechsel", "Warnungen sind Hinweise und blockieren nicht"],
  },
  "audit.guards": {
    title: "Blocker und Warnungen",
    body: "Blocker sind Pflichtbedingungen für den nächsten Schritt, zum Beispiel ein ungeklärter Interessenkonflikt. Warnungen weisen auf Lücken hin, etwa fehlende Qualifikation einzelner Personen.",
  },
  "audit.scope": {
    title: "Ziele und Scope",
    body: "Legt fest, was geprüft wird: Normen, Prozesse und die Anforderungen daraus. Anforderungen im Scope gehören immer zu Normen im Scope.",
  },
  "audit.team": {
    title: "Auditteam",
    body: "Das Team muss jede Norm im Scope durch mindestens eine qualifizierte Person abdecken. Fehlt einer einzelnen Person die Qualifikation, erscheint nur eine Warnung.",
  },
  "audit.impartiality": {
    title: "Unparteilichkeit",
    body: "Niemand auditiert die eigene Arbeit. Wer einen Prozess verantwortet oder im selben Audit Auditee ist, darf nicht im Auditteam sein. Offene Konflikte blockieren den Start.",
    points: ["Lösung: Teammitglied ersetzen", "Alternativ Warnung mit Begründung übersteuern, das wird protokolliert"],
  },
  "audit.plan": {
    title: "Auditplan",
    body: "Die Zeitslots des Audits mit Thema, Ort, Prozess, geprüften Anforderungen und Teilnehmenden.",
  },
  "audit.risk": {
    title: "Risikoeinstufung",
    body: "Die risikobasierte Einstufung begründet, warum dieses Audit jetzt und in diesem Umfang stattfindet.",
  },
  "audit.checklist": {
    title: "Checkliste",
    body: "Beim Anlegen wird der Fragenkatalog als Kopie eingefroren. Spätere Änderungen am Katalog wirken nie auf dieses Audit.",
    points: ["Jeder Punkt wird bewertet: konform, Abweichung oder nicht anwendbar", "Aus einer Abweichung legen Sie direkt eine Feststellung an"],
  },
  "audit.carryOver": {
    title: "Übernommene Punkte",
    body: "Offene Feststellungen aus einem Vor-Audit werden erneut geprüft. Sie stehen oben in der Checkliste und tragen die Herkunft Übernahme.",
  },
  "audit.markConform": {
    title: "Demo-Abkürzung",
    body: "Setzt alle noch offenen Punkte auf konform, damit die Vorführung zügig weitergeht. Die Aktion wird ausdrücklich als Demo-Aktion im Verlauf protokolliert.",
  },
  "audit.findings": {
    title: "Feststellungen",
    body: "Dokumentierte Auditergebnisse mit Klassifizierung. Abweichungen brauchen Verantwortliche und Frist, danach folgt der Ablauf aus Ursachenanalyse, Maßnahmen und Wirksamkeitsprüfung.",
  },
  "audit.report": {
    title: "Bericht",
    body: "Entwurf, In Prüfung, Freigegeben. Ein freigegebener Bericht ist gesperrt und trägt einen Hash. Änderungen sind nur als neue Version mit Begründung möglich, die alte Version bleibt als ersetzt sichtbar.",
  },
  "audit.reportHash": {
    title: "Inhalts-Hash",
    body: "Fingerabdruck des Berichtsinhalts bei der Freigabe. Ändert sich der Inhalt, ändert sich der Hash, so ist Manipulation erkennbar. Im Dummy bewusst nicht kryptografisch, produktiv wäre es SHA-256.",
  },
  "audit.history": {
    title: "Verlauf des Audits",
    body: "Jede Änderung an diesem Audit mit Person, Rolle, Zeit und Hash. Der Verlauf wird nur ergänzt, nie geändert oder gelöscht.",
  },

  /* Feststellung */
  "finding.classification": {
    title: "Klassifizierung",
    body: "Bestimmt, was danach passieren muss.",
    points: [
      "Hauptabweichung: Anforderung nicht erfüllt, Systemwirksamkeit gefährdet",
      "Nebenabweichung: Anforderung teilweise nicht erfüllt, Einzelfall",
      "Beobachtung: Hinweis ohne Abweichung",
      "Verbesserungspotenzial: Anregung ohne Pflicht",
      "Positive Feststellung: gute Praxis",
    ],
  },
  "finding.chain": {
    title: "Nachweiskette",
    body: "Zeigt den roten Faden von der Anforderung bis zur Wirksamkeitsprüfung. Erledigte Glieder sind gefüllt, offene nur umrandet. Jedes Glied ist anklickbar.",
  },
  "finding.workflow": {
    title: "Ablauf einer Feststellung",
    body: "Entwurf, Offen, Angenommen oder Zurückgewiesen, In Bearbeitung, Wirksamkeitsprüfung, Geschlossen. Beobachtungen, Verbesserungspotenziale und positive Feststellungen können ohne diesen Zyklus geschlossen werden.",
  },
  "finding.rca": {
    title: "Ursachenanalyse",
    body: "Findet heraus, warum die Abweichung entstanden ist (5-Why, Ishikawa oder Freitext). Ohne dokumentierte Ursachenanalyse geht die Feststellung nicht in Bearbeitung.",
  },
  "finding.actions": {
    title: "Korrektur und Korrekturmaßnahme",
    body: "Beides ist fachlich verschieden. Die Korrektur beseitigt das Symptom sofort. Die Korrekturmaßnahme beseitigt die Ursache (ISO Kapitel 10.2). Für die Bearbeitung braucht es mindestens eine Korrekturmaßnahme.",
  },
  "finding.effectiveness": {
    title: "Wirksamkeitsprüfung",
    body: "Weist nach, dass die Ursache dauerhaft beseitigt ist. Es gilt das Vier-Augen-Prinzip: Die Prüfung führt eine Person durch, eine zweite bestätigt sie. Erst dann kann die Feststellung geschlossen werden.",
  },
  "finding.links": {
    title: "Verknüpfungen",
    body: "Jede Feststellung verweist auf Anforderung, Prozess und Standort, optional auf Risiken und Kennzahlen. So ist sie in der Auswertung wiederzufinden.",
  },
  "finding.evidence": {
    title: "Nachweise",
    body: "Dateien, Fotos, Dokumentlinks oder Interviewnotizen. Im Dummy werden Uploads nur simuliert: Dateiname und Größe werden übernommen, der Hash wird berechnet.",
  },
  "finding.history": {
    title: "Verlauf der Feststellung",
    body: "Zeigt die letzten Ereignisse zu dieser Feststellung. Den vollständigen Verlauf finden Sie im Tab Verlauf des Audits und unter Verlauf.",
  },
  "finding.ai": {
    title: "KI-Unterstützung",
    body: "Im Dummy sind die Vorschläge vorbereitet und werden nur simuliert. Übernommene Inhalte werden als KI-gestützt gekennzeichnet und im Verlauf markiert.",
  },

  /* Listen und Auswertung */
  "findings.page": {
    title: "Feststellungen",
    body: "Alle Feststellungen über alle Audits. Filtern Sie nach Status, Klassifizierung oder Norm und springen Sie direkt in die Bearbeitung.",
  },
  "actions.page": {
    title: "Maßnahmen",
    body: "Alle Korrekturen und Korrekturmaßnahmen über alle Feststellungen. Überfällige Fristen sind rot markiert.",
  },
  "dashboard.page": {
    title: "Dashboard",
    body: "Kennzahlen zum Stand des Auditprogramms. Alle Werte werden live aus den Daten berechnet.",
  },
  "dashboard.openNc": {
    title: "Offene Abweichungen",
    body: "Hauptabweichungen und Nebenabweichungen ab Status Offen bis zum Schließen. Eine Feststellung zählt je betroffener Norm.",
  },
  "dashboard.due": {
    title: "Fälligkeiten",
    body: "Bald fällig sind Maßnahmen innerhalb von 14 Tagen und Wirksamkeitsprüfungen innerhalb von 30 Tagen.",
  },

  /* Verlauf */
  "trail.page": {
    title: "Verlauf",
    body: "Das Protokoll jeder Änderung im System. Jeder Eintrag ist mit dem vorherigen verkettet, deshalb fällt nachträgliche Manipulation auf.",
  },
  "trail.integrity": {
    title: "Integritätsprüfung",
    body: "Berechnet die Kette aller Einträge neu und meldet, ob sie lückenlos ist. Der Hash ist im Dummy bewusst nicht kryptografisch. Produktiv wäre es SHA-256 serverseitig, optional mit qualifiziertem Zeitstempel.",
  },
  "trail.hash": {
    title: "Hash",
    body: "Angezeigt sind die ersten 8 Zeichen. Der vollständige Wert steht im Tooltip.",
  },

  /* Kataloge */
  "catalogs.page": {
    title: "Fragenkataloge",
    body: "Versionierte Vorlagen für Checklisten, auch normübergreifend. Eine Checkliste ist immer eine eingefrorene Kopie, Katalogänderungen wirken nicht auf laufende Audits.",
  },
  "catalogs.mapping": {
    title: "Normübergreifendes Mapping",
    body: "Zeigt gleichwertige Anforderungen anderer Normen. Gleiche Kapitelnummer heißt nicht gleicher Inhalt, und gleicher Inhalt hat nicht immer dieselbe Nummer. Deshalb wird über die gemeinsame Grundstruktur (Harmonized Structure) und kuratierte Paare gemappt.",
  },
  "catalogs.versions": {
    title: "Versionen",
    body: "Jede inhaltliche Änderung erzeugt eine neue Version. Der Vergleich zeigt hinzugefügte, geänderte und entfernte Fragen.",
  },

  "catalogs.draft": {
    title: "Neue Version eines Katalogs",
    body: "Änderungen entstehen immer in einem Entwurf, nie an der freigegebenen Version. Mit der Freigabe wird der Entwurf zur aktuellen Version, die bisherige Version wird außer Kraft gesetzt. Dafür ist ein Änderungsgrund Pflicht.",
  },
  "catalogs.snapshot": {
    title: "Laufende Audits bleiben unverändert",
    body: "Eine Checkliste ist eine eingefrorene Kopie des Katalogs zum Zeitpunkt ihrer Erstellung. Eine neue Katalogversion wirkt nur auf Audits, deren Checkliste danach angelegt wird.",
  },

  /* Integrationen */
  "integrations.page": {
    title: "Integrationen",
    body: "Diese Punkte sind im Konzept beschrieben, aber bewusst nicht Teil des Clickdummys.",
  },
  /* @A1 */
  /* @A2 */
  /* @B */
  /* @C1 */
  /* @C2 */
} as const satisfies Record<string, HelpTopicDef>;

export type HelpTopic = keyof typeof helpTopics;
