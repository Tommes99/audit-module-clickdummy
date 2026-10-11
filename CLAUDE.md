# CLAUDE.md: Audit-Modul Clickdummy

Diese Datei ist die verbindliche Arbeitsgrundlage für Claude Code in diesem Repository. Vor jeder Aufgabe lesen. Bei Widerspruch zwischen dieser Datei und einer Annahme gilt diese Datei.

## 1. Zweck und Abgrenzung

Klickbarer Dummy eines Audit-Moduls für ESG/EHS/GRC-Software. Unternehmen planen, führen und dokumentieren damit interne und externe Audits (ISO 9001, 14001, 45001, 50001, Lieferantenaudits).

Der Dummy dient einer Präsentation im Vorstellungsgespräch. Er soll drei Dinge sichtbar machen: das Datenmodell mit seinen Verknüpfungen, die Nachvollziehbarkeit jeder Aktion und einen fachlich korrekten Workflow nach ISO 19011.

**Ist:** Frontend-only, Mock-Daten, Client-State mit localStorage, Rollenwechsel ohne Login.
**Ist nicht:** Prototyp mit Backend, Auth, echten Uploads, echten KI-Aufrufen oder Integrationen. Nichts davon bauen, auch nicht "nur kurz".

Fiktives Demo-Unternehmen: Muster Metall GmbH, Werke Leipzig und Chemnitz. Demo-Datum: 08.10.2026 (`DEMO_TODAY` in `src/domain/workflows.ts`). Niemals `new Date()` für fachliche Datumslogik verwenden, immer `DEMO_TODAY` bzw. `demoNow()`.

## 2. Setup

```bash
npx create-next-app@latest audit-clickdummy --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd audit-clickdummy
npx shadcn@latest init
npx shadcn@latest add button badge card tabs table dialog sheet select input textarea label tooltip dropdown-menu separator popover command avatar progress alert sonner checkbox radio-group scroll-area
npm i zustand @tanstack/react-table date-fns lucide-react
npm i -D tsx
```

Hinweis: shadcn nutzt hier den Stil "base-nova" (Base UI statt Radix). Auslöser verwenden die Prop `render` statt `asChild`. Auswahlfelder immer über `NativeSelect`.

Danach die vorbereiteten Dateien aus diesem Paket nach `src/` und `scripts/` kopieren und in `package.json` ergänzen:

```json
"scripts": {
  "validate:seed": "tsx scripts/validate-seed.ts",
  "typecheck": "tsc --noEmit",
  "demo:check": "tsx scripts/demo-walkthrough.ts"
}
```

## 3. Projektstruktur

```
src/
  types/domain.ts          Domänenmodell (einzige Quelle für Typen)
  domain/
    labels.ts              deutsche UI-Labels und Status-Töne (einzige Quelle für Bezeichnungen)
    workflows.ts           erlaubte Statusübergänge, DEMO_TODAY, demoNow()
    rules.ts               Guards und Fachregeln (Unparteilichkeit, CAPA, Vier-Augen, Mapping, Abdeckung)
    factories.ts           Checklisten-Snapshot, Nummernvergabe, IDs, reportContentHash()
    permissions.ts         Rechte-Matrix (Abschnitt 9) als can(), Session, demoPersonas
    help.ts                Hilfetexte hinter dem "?" (HelpHint), einzige Quelle für erklärende Texte
    tour.ts                Schritte des Demo-Rundgangs (Abschnitt 14)
  lib/
    hash.ts                Demo-Hash (nicht kryptografisch)
    audit-trail.ts         appendEvent, verifyChain, eventsFor
  data/
    seed/                  Seed-Daten, aufgeteilt nach Bereichen, plus validate.ts
    ai-suggestions.ts      vorbereitete KI-Vorschläge für die Demo
  store/
    app-store.ts           Zustand-Store useAppStore (persist), Actions als dünne Hüllen um commands/
    commands/              reine Funktionen (data, session, ...) => { data, result }: Guard, Update, appendEvent
    selectors.ts           abgeleitete Werte (nie gespeichert)
    helpers.ts             emit() (einzige Schreibstelle für Events), replaceById, ActionResult
  hooks/use-can.ts         Rechteprüfung für die aktuelle Persona
  components/              ui/ (shadcn, Base UI), shared/ (StatusBadge, EntityChip, GuardHint, HelpHint, Panel, ...), shell/ (Seitenleiste, Schnellsuche, Rundgang, Rollenwechsler), je Bereich
  app/                     Routen
scripts/validate-seed.ts   Integritätsprüfung des Seeds
scripts/demo-walkthrough.ts  spielt das Demo-Drehbuch (Schritte 4 bis 11) gegen die Commands durch (npm run demo:check)
```

## 4. Fachglossar

| Deutsch (UI) | Code | Bedeutung |
|---|---|---|
| Auditprogramm | `AuditProgramme` | Jahresplanung aller Audits mit Zielen, risikobasiert (ISO 19011 Kap. 5) |
| Audit | `Audit` | einzelnes Audit mit Scope, Team, Terminen |
| Auditplan | `AuditPlanSlot` | Zeitslots des Audits mit Thema, Ort, Teilnehmenden |
| Fragenkatalog | `QuestionCatalog` | versionierte Vorlage, normübergreifend möglich |
| Checkliste | `Checklist` | eingefrorener Snapshot eines Katalogs für genau ein Audit |
| Checklistenpunkt | `ChecklistItem` | Frage mit Bewertung, Notiz, Nachweisen, Feststellungen |
| Übernahme | `origin: "carry_over"` | offene Feststellung aus Vor-Audit wird erneut geprüft |
| Nachweis | `Evidence` | Datei, Foto, Dokumentlink oder Interviewnotiz |
| Feststellung | `Finding` | dokumentiertes Auditergebnis mit Klassifizierung |
| Hauptabweichung | `major_nc` | Anforderung nicht erfüllt, Systemwirksamkeit gefährdet |
| Nebenabweichung | `minor_nc` | Anforderung teilweise nicht erfüllt, Einzelfall |
| Beobachtung | `observation` | Hinweis ohne Abweichung, Risiko einer künftigen Abweichung |
| Verbesserungspotenzial | `opportunity` | Anregung, keine Pflicht zur Umsetzung |
| Positive Feststellung | `positive` | gute Praxis, wird im Bericht hervorgehoben |
| Korrektur | `correction` | Sofortmaßnahme, beseitigt das Symptom |
| Korrekturmaßnahme | `corrective_action` | beseitigt die Ursache (Kap. 10.2) |
| Ursachenanalyse | `RootCauseAnalysis` | 5-Why, Ishikawa oder Freitext |
| Wirksamkeitsprüfung | `EffectivenessCheck` | Nachweis, dass die Ursache dauerhaft beseitigt ist, Vier-Augen-Prinzip |
| Abdeckungsmatrix | `computeCoverage()` | Normkapitel × Standort: zuletzt auditiert, nächstes geplant |
| Unparteilichkeit | `findImpartialityConflicts()` | niemand auditiert die eigene Arbeit |
| Harmonized Structure | `harmonizedKey` | gemeinsame Grundstruktur der ISO-Managementsystemnormen |
| Audit-Trail / Verlauf | `AuditEvent` | append-only Protokoll jeder Änderung, hash-verkettet |

Korrektur und Korrekturmaßnahme sind fachlich verschieden und dürfen in UI und Texten nie vermischt werden.

## 5. Datenmodell: Invarianten

Das Modell steht vollständig in `src/types/domain.ts`. Diese Invarianten gelten immer und werden von `validateSeed()` geprüft:

1. Jede Feststellung referenziert mindestens eine Anforderung (aus den Normen im Audit-Scope), einen Prozess und einen Standort (bei Lieferantenaudits `siteId: null`).
2. Feststellung und Checklistenpunkt verweisen gegenseitig aufeinander (`checklistItemId` und `findingIds`).
3. Maßnahmen verweisen über `source` auf ihre Quelle, die Quelle führt die Maßnahme in `actionIds`. `source.type` ist generisch, damit CAPA später auch Vorfälle und Reklamationen aufnehmen kann.
4. Abweichungen (`major_nc`, `minor_nc`) haben ab Status `open` eine verantwortliche Person und eine Frist.
5. Eine geschlossene Abweichung hat eine Wirksamkeitsprüfung mit Ergebnis `effective`, durchgeführt und bestätigt von zwei verschiedenen Personen.
6. Checklisten sind Snapshots. Fragen werden kopiert, nie referenziert. Katalogänderungen wirken nie auf laufende oder abgeschlossene Audits.
7. Freigegebene Berichte sind unveränderlich. Änderung nur über neue Version mit `changeReason`. Alte Version erhält Status `superseded` und bleibt sichtbar.
8. Anforderungen im Audit-Scope gehören zu Normen im Audit-Scope.
9. Fachliche Nummern (A-2026-09, F-2026-007, M-2026-007) werden über `nextNumber()` vergeben, technische IDs über `newId()`. In der UI erscheinen nur fachliche Nummern.

### Normübergreifendes Mapping

`equivalentRequirements()` nutzt zwei Mechanismen:
- `harmonizedKey` für Kapitel mit gemeinsamem HS-Text (z. B. internes Audit 9.2 in allen vier Normen).
- `relatedRequirementIds` für kuratierte Paare normspezifischer Kapitel (z. B. Bewertung der Einhaltung 9.1.2 in 14001 und 45001).

Wichtig: Gleiche Kapitelnummer bedeutet nicht gleicher Inhalt. ISO 14001 6.1.2 sind Umweltaspekte, ISO 45001 6.1.2 ist die Gefährdungsermittlung. Und gleicher Inhalt hat nicht immer die gleiche Nummer: Nichtkonformität ist in ISO 50001:2018 Kap. 10.1, in den anderen drei Normen Kap. 10.2. Nie über Kapitelnummern mappen.

## 6. Statusmodelle

Erlaubte Übergänge in `src/domain/workflows.ts`, Bedingungen in `src/domain/rules.ts`.

**Audit:** Geplant → In Vorbereitung → In Durchführung → Berichtserstellung → Bericht freigegeben → Abgeschlossen. Absage aus Geplant und In Vorbereitung.

| Übergang | Bedingung (Guard) |
|---|---|
| In Vorbereitung → In Durchführung | Checkliste vorhanden (außer Third-Party-Audits), keine offenen Unparteilichkeitskonflikte, jede Norm im Scope durch mindestens eine qualifizierte Person abgedeckt. Qualifikationslücken Einzelner sind Warnung, kein Blocker. |
| In Durchführung → Berichtserstellung | alle Checklistenpunkte bewertet, keine Feststellung im Entwurf |
| Berichtserstellung → In Durchführung | Begründung Pflicht, nur solange der Bericht im Entwurf ist |
| Berichtserstellung → Bericht freigegeben | aktueller Bericht hat Status freigegeben |
| Bericht freigegeben → Abgeschlossen | alle Abweichungen geschlossen, aktuelle Berichtsversion freigegeben. Offene Verbesserungspotenziale nur als Warnung. |

**Feststellung:** Entwurf → Offen → Angenommen oder Zurückgewiesen → In Bearbeitung → Wirksamkeitsprüfung → Geschlossen. Beobachtungen, Verbesserungspotenziale und positive Feststellungen dürfen ohne CAPA-Zyklus geschlossen werden.

| Übergang | Bedingung |
|---|---|
| Entwurf → Offen | Anforderung, Prozess, Beschreibung. Bei Abweichung zusätzlich Verantwortliche und Frist. Ohne Nachweis nur Warnung. |
| Angenommen → In Bearbeitung | Ursachenanalyse dokumentiert, mindestens eine Korrekturmaßnahme (nicht nur Korrektur) |
| In Bearbeitung → Wirksamkeitsprüfung | alle Maßnahmen erledigt oder verworfen, mindestens eine erledigt |
| Wirksamkeitsprüfung → Geschlossen | Prüfung durchgeführt, Ergebnis wirksam, bestätigt durch zweite Person |
| Wirksamkeitsprüfung → In Bearbeitung | Ergebnis nicht wirksam, Begründung Pflicht |
| Zurückgewiesen → Geschlossen | Begründung Pflicht. Nicht für Abweichungen (Invariante 5): erneut übergeben oder umklassifizieren |

**Maßnahme:** Offen → In Umsetzung → Erledigt. Wiedereröffnen und Verwerfen mit Begründung. Solange die Feststellung in der Wirksamkeitsprüfung oder geschlossen ist, werden ihre Maßnahmen weder geändert noch neu angelegt (`actionChangeLockedBy`).

**Bericht:** Entwurf → In Prüfung → Freigegeben. In Prüfung → Entwurf mit Begründung. Einreichen und Freigeben nur, wenn das Audit in der Berichtserstellung ist (oder danach für neue Versionen). Freigegeben → Ersetzt nur durch neue Version.

**Fragenkatalog:** Entwurf → Freigegeben → Außer Kraft. Freigegebene Versionen sind unveränderlich. Änderungen entstehen nur in einem Entwurf, der aus der aktuellen freigegebenen Version kopiert wird (neue Frage-IDs, ein Entwurf je Katalog). Freigabe (Guard in `checkReleaseCatalog`): mindestens eine Frage, jede Frage mit Text und Anforderungen aus den Normen des Katalogs, tatsächliche Änderung gegenüber der Vorgängerversion, Änderungsgrund als Pflichtfeld. Mit der Freigabe wird die Vorgängerversion außer Kraft gesetzt. Bestehende Checklisten bleiben unverändert (Snapshot, Invariante 6). Verwerfen eines Entwurfs wird protokolliert.

Übergänge mit Begründungspflicht stehen in `transitionsRequiringReason`. Die UI öffnet dafür einen Dialog mit Pflichtfeld.

UI-Regel für Statuswechsel: Buttons nur für erlaubte Übergänge zeigen. Ist ein Guard nicht erfüllt, Button deaktiviert lassen und Blocker im Tooltip oder als Hinweisbox direkt darunter nennen. Warnungen erscheinen als gelbe Hinweisbox, blockieren aber nicht.

## 7. Audit-Trail

Der Verlauf ist das zentrale Argument für Auditsicherheit. Regeln:

1. Jede Mutation läuft über eine Store-Action. Jede Store-Action ruft `appendEvent()` auf. Keine Ausnahme, auch nicht für Kleinigkeiten wie Notizen.
2. Events werden nie geändert oder gelöscht. Es gibt keine Action, die `events` anders als über `appendEvent()` verändert.
3. `summary` ist ein vollständiger deutscher Satzanfang ohne Punkt, z. B. "Nebenabweichung F-2026-007 erfasst".
4. Bei Feldänderungen `changes` mit `before` und `after` befüllen.
5. Bei Begründungspflicht `reason` setzen.
6. KI-gestützte Inhalte: `aiGenerated: true` und Action `ai_suggestion_accepted` bzw. `ai_suggestion_rejected`.
7. `actorRole` ist die Rolle, in der die Person gerade handelt (aus dem Rollenwechsler).

Darstellung: Tab "Verlauf" je Audit (gefiltert über `auditId`), Mini-Verlauf je Feststellung, globale Seite `/verlauf` mit Button "Integrität prüfen" (`verifyChain()`), der Anzahl und Ergebnis meldet. Hash gekürzt anzeigen (erste 8 Zeichen), vollständig im Tooltip.

`demoDigest()` ist bewusst nicht kryptografisch. In der Präsentation so benennen: Produktiv wäre das SHA-256 serverseitig, optional mit qualifiziertem Zeitstempel.

## 8. Store-Konventionen

- Ein Zustand-Store `useAppStore` in `src/store/app-store.ts` mit `data: SeedData`, `session: { personId, role }` und `tourDone` (Fortschritt des Demo-Rundgangs, reiner UI-Zustand ohne Event).
- `persist` mit Key `audit-clickdummy-v1` und `version`. Bei Versionswechsel auf Seed zurücksetzen, keine Migrationen bauen.
- `resetToSeed()` nutzt `freshSeed()` und setzt auch den Demo-Rundgang zurück. Button "Demo zurücksetzen" im Benutzermenü, mit Bestätigungsdialog.
- Actions geben ein `GuardResult` zurück. Die Komponente zeigt bei `ok: false` die Blocker als Toast (sonner), bei Warnungen einen gelben Toast.
- Muster jeder Action: Guard aus `rules.ts` prüfen → Daten unveränderlich aktualisieren → `appendEvent()` → `GuardResult` zurückgeben.
- Abgeleitete Werte (Zähler, Fälligkeiten, Abdeckung) nie speichern, immer über Selektoren in `src/store/selectors.ts` berechnen.
- Next.js und localStorage: Alle Store-Komponenten sind Client-Komponenten. Ein `HydrationGate` rendert Inhalte erst nach der Hydrierung, um Mismatch-Fehler zu vermeiden.

Benötigte Actions (Mindestumfang):

```
setSession(personId, role)            resetToSeed()
transitionAudit(id, to, reason?)      assignAuditor(auditId, personId)
removeAuditor(auditId, personId)      overrideWarning(auditId, warningKey, reason)
createChecklist(auditId, catalogId)   rateItem(itemId, rating, notes?)
markRemainingConform(checklistId)     // nur Demo-Abkürzung, als solche geloggt
attachEvidence(target, draft)         createFinding(draft) -> id
updateFinding(id, patch)              transitionFinding(id, to, reason?)
setRootCause(findingId, rca)          linkFinding(findingId, { riskIds?, kpiIds? })
createAction(draft)                   transitionAction(id, to, reason?)
planEffectivenessCheck(findingId, plannedDate, method)
recordEffectivenessCheck(id, result, comment)
approveEffectivenessCheck(id)         // Guard: andere Person als Durchführende
createReportDraft(auditId, fromAi)    submitReport(id)
returnReportToDraft(id, reason)
releaseReport(id)                     // setzt contentHash, danach transitionAudit(..., "released")
createReportVersion(id, reason)
acceptAiSuggestion(key, target)       rejectAiSuggestion(key, target)
createCatalogDraft(baseId) -> id      saveCatalogQuestion(catalogId, questionId|null, input)
removeCatalogQuestion(catalogId, qId) moveCatalogQuestion(catalogId, qId, dir)
discardCatalogDraft(catalogId)        releaseCatalogVersion(catalogId, reason)
```

## 9. Rollen und Sichtbarkeit

Rollenwechsler oben rechts mit fünf Personas. Rechte werden im Dummy nur über UI gesteuert (Buttons ausblenden oder deaktivieren mit Tooltip "Nur für ..."), nicht technisch erzwungen.

| Persona | Rolle | Startseite zeigt |
|---|---|---|
| Sandra Keller | Auditprogramm-Verantwortliche | Programmstatus, Audits mit Blockern, fällige Wirksamkeitsprüfungen |
| Jonas Brandt | Auditor | eigene anstehende Audits, unbewertete Checklistenpunkte |
| Thomas Richter | Auditee | Feststellungen zur Annahme, angeforderte Nachweise |
| Aylin Demir | Maßnahmenverantwortliche | eigene Maßnahmen nach Fälligkeit |
| Petra Schulz | Geschäftsführung | Dashboard, freigegebene Berichte |

| Aktion | Programm-V. | Auditor | Auditee | Maßnahmen-V. | GF |
|---|---|---|---|---|---|
| Programm und Audits planen | ja | nein | nein | nein | lesen |
| Checkliste bewerten, Feststellung anlegen | ja | ja (zugewiesene Audits) | nein | nein | nein |
| Nachweise bereitstellen | ja | ja | ja | ja | nein |
| Feststellung annehmen oder zurückweisen | nein | nein | ja (eigene Prozesse) | nein | nein |
| Ursachenanalyse, Maßnahmen anlegen | ja (koordinierend, im Auftrag) | lesen | ja | ja (eigene) | lesen |
| Maßnahme erledigen | nein | nein | ja (eigene Prozesse) | ja (eigene) | nein |
| Wirksamkeit prüfen oder bestätigen | ja | ja | nein | nein | nein |
| Bericht freigeben | ja | ja (Auditleitung) | nein | nein | lesen |
| Fragenkataloge pflegen (neue Version) | ja | nein | nein | nein | nein |
| Verlauf einsehen | ja | ja | ja | ja | ja |

## 10. Screens und Routen

| Route | Inhalt | Priorität |
|---|---|---|
| `/` | Meine Aufgaben, rollenabhängig | 1 |
| `/audits/[id]` | Audit-Detail mit Tabs: Übersicht und Plan, Checkliste, Feststellungen, Bericht, Verlauf | 1 |
| `/feststellungen` | Liste aller Feststellungen mit Schnellfiltern (`?filter=open_nc|to_accept|effectiveness`) | 2 |
| `/feststellungen/[id]` | Feststellung mit Nachweiskette, CAPA-Schritten, Verknüpfungen, Mini-Verlauf | 1 |
| `/verlauf` | globaler Audit-Trail mit Filter und Integritätsprüfung | 1 |
| `/programm` | Jahresplan (Liste oder Monatsraster) und Tab Abdeckungsmatrix | 2 |
| `/massnahmen` | Tabelle aller Maßnahmen, Filter nach Status, Fälligkeit (`?due=overdue|due_soon|open`), Person, Standort | 2 |
| `/dashboard` | Kennzahlen: offene Abweichungen nach Norm und Standort, Fälligkeiten, Programmfortschritt | 2 |
| `/kataloge` und `/kataloge/[id]` | Fragenkataloge mit Versionen, Anforderungen mit normübergreifendem Mapping, Pflege als neue Version (Entwurf, Fragen ändern, ergänzen, verschieben, entfernen, mit Begründung freigeben) | 3 |
| `/integrationen` | Platzhalter, siehe Abschnitt 13 | 3 |

Navigation (Seitenleiste, nach Arbeitsablauf gruppiert): **Arbeit** (Meine Aufgaben, Feststellungen, Maßnahmen), **Planung** (Audits und Jahresplan, Abdeckungsmatrix, Fragenkataloge), **Auswertung** (Dashboard, Verlauf), **Konzept** (Integrationen). Zähler bei Meine Aufgaben und überfälligen Maßnahmen. Kopfzeile: Schnellsuche (Strg K oder Cmd K), Demo-Datum mit Hilfe, Rollenwechsler. Unten in der Seitenleiste: Demo-Rundgang (Schritte aus Abschnitt 14, wechselt Rolle und öffnet die Seite). Detailseiten tragen Brotkrumen.

Umsetzungsreihenfolge: Layout mit Navigation, Rollenwechsler und Store → Audit-Detail Tab Übersicht → Checkliste mit Feststellung anlegen → Feststellungsdetail mit CAPA → Verlauf → Bericht → Meine Aufgaben → Dashboard → Programm und Matrix → Kataloge → Platzhalter. Erst wenn Priorität 1 durchgängig klickbar ist, Priorität 2 beginnen.

## 11. UI- und Design-Konventionen

**Sprache und Texte**
- UI vollständig auf Deutsch, Umlaute ä, ö, ü, ß, Satzanfang groß, sonst normale Schreibung, keine Großbuchstaben-Labels.
- Keine Gedankenstriche (Em-Dash) in UI-Texten. Stattdessen Doppelpunkt, Komma oder neuer Satz.
- Aktive Verben auf Buttons, die Bezeichnung bleibt durch den Ablauf gleich: "Bericht freigeben" führt zur Meldung "Bericht freigegeben".
- Alle Status- und Klassifizierungstexte aus `labels.ts`, nie hartkodiert.
- Fehler- und Leerzustände nennen, was zu tun ist ("Noch keine Feststellungen. Legen Sie eine aus einem Checklistenpunkt an.").
- Datumsformat de-DE über `dateFormat` und `dateTimeFormat`. Fristen zusätzlich relativ (`relativeDueText()`).

**Gestaltung**
- Zielgruppe: QM- und EHS-Fachleute, die mit dichten Informationen arbeiten, teils am Tablet in der Halle. Sachlich, dicht, gut lesbar.
- Bewusst vermeiden: identische abgerundete Karten mit Schatten für alles, Verlaufsflächen, dekorative Icons ohne Funktion. Icons nur dort, wo sie das Scannen unterstützen (Seitenleiste, Schnellsuche).
- Flächen über `Panel` (heller Grund, feine Linie, kein Schatten), nicht als Kartenraster. Seiten bleiben ruhig: Erklärungen stehen hinter dem "?" (`HelpHint`, Texte in `domain/help.ts`, 1 bis 4 pro Seite, höchstens zwei, drei kurze Sätze), nicht als Fließtext. Blocker, Warnungen und Leerzustände bleiben sichtbar.
- Tabellen und Listen sind das Hauptwerkzeug. Karten nur für echte Objekte (Feststellung, Audit), nicht als Layout-Raster.
- Farbe trägt Bedeutung. Grundfläche und Text neutral und kühl, eine Akzentfarbe für Interaktion, Statusfarben nur für Status.
- Palette (Tokens in `globals.css`): Fläche `#F6F7F9`, Karten `#FFFFFF`, Text `#121826`, Linien `#E2E5EB`, Akzent `#2A52BE`, Erfolg `#2E7D4F`, Warnung `#B7791F`, Gefahr `#B3261E`, gedämpft `#5B6474`. Status-Badges sind ruhig (Punkt in Statusfarbe plus Text), nur Warnung und Gefahr sind getönt.
- Typografie: eine Familie (Inter) mit tabellarischen Ziffern für Nummern, Fristen und Kennzahlen.
- Ein wiedererkennbares Element: die **Nachweiskette** auf der Feststellungsseite. Eine horizontale Spur Anforderung → Checklistenpunkt → Nachweis → Feststellung → Maßnahmen → Wirksamkeitsprüfung, jedes Glied klickbar, erledigte Glieder gefüllt, offene als Umriss. Hier darf Gestaltung auffallen, alles andere bleibt ruhig.
- Verknüpfte Objekte erscheinen überall als klickbare Chips mit fachlicher Nummer und Kurztitel (z. B. "R-012 Kollision Flurförderzeug", "ISO 45001 8.1.3").
- Checklistenansicht tablet-tauglich: Bewertung mit drei großen Schaltflächen, Notiz und Foto direkt am Punkt, "Feststellung anlegen" öffnet ein Sheet mit vorbefüllten Bezügen.
- Barrierefreiheit: sichtbarer Tastaturfokus, Status nie nur über Farbe (immer Text im Badge), ausreichende Kontraste.

## 12. KI-Funktionen im Dummy

Alle KI-Funktionen sind simuliert über `src/data/ai-suggestions.ts`. Keine API-Aufrufe, kein `fetch`.

- Button "Mit KI formulieren" im Feststellungs-Sheet, "Verknüpfungen vorschlagen", "Ursachenanalyse vorschlagen", "Berichtsentwurf erzeugen".
- Ablauf: Ladezustand ca. 800 ms → Vorschlag in abgesetztem Bereich mit Hinweistext → "Übernehmen", "Bearbeiten", "Verwerfen".
- Übernommene Inhalte tragen das Flag `aiAssisted` am Objekt (`Finding`, `AuditReport`, `RootCauseAnalysis`, dort optional) und erzeugen ein Event mit `aiGenerated: true`.
- Kennzeichnung im UI: kleines Label "KI-gestützt" am Objekt, nicht wegklickbar.

## 13. Platzhalter (im Konzept, nicht im Dummy)

Seite `/integrationen` zeigt diese Punkte als ruhige Liste mit einem Satz Beschreibung und dem Vermerk "Im Konzept beschrieben, nicht Teil des Clickdummys":
REST-API und Webhooks bei Statuswechseln, SSO und Gastzugänge für externe Auditor:innen, Excel-Import bestehender Checklisten mit Mapping auf Normkapitel, PDF-Export mit Signatur, Lieferantenportal mit Selbstauskunft, Offline-Modus für die Durchführung vor Ort, Übergabe von Kennzahlen an das ESG-Reporting.

## 14. Demo-Drehbuch

Ablauf für die Präsentation, ca. 10 Minuten. Alle benötigten Daten liegen im Seed.

1. **Vorbereitung:** "Demo zurücksetzen". Rolle Sandra Keller.
2. **Meine Aufgaben:** A-2026-09 erscheint mit Hinweis auf zwei Konflikte im Auditteam.
3. **Programm, Tab Abdeckungsmatrix:** Für Leipzig ist ISO 45001 8.1.3 noch nie auditiert, nächstes geplantes Audit A-2026-09. Begründung der Risikoeinstufung "hoch" zeigen.
4. **Audit A-2026-09, Übersicht:** "Audit starten" ist deaktiviert. Blocker: Michael Wagner verantwortet Instandhaltung und ist Auditee. Warnung: keine Qualifikation für ISO 45001. Wagner entfernen, Jonas Brandt hinzufügen. Blocker verschwinden, Audit starten.
5. **Checkliste:** Übernommener Punkt zu F-2026-004 steht oben. Punkt 4 (Gefährdungsbeurteilung bei Änderungen) öffnen: Nachweis "Gefährdungsbeurteilung Halle 3, Stand 11/2025" hat der Auditee schon vor dem Audit bereitgestellt. Bewertung "Abweichung", simuliertes Foto anhängen, "Feststellung anlegen".
6. **Feststellungs-Sheet:** Anforderungen ISO 45001 6.1.2 und 8.1.3, Prozess Intralogistik Leipzig und Standort sind vorbefüllt. Stichpunkte eingeben, "Mit KI formulieren", übernehmen. Klassifizierung Nebenabweichung, verantwortlich Thomas Richter, Frist 13.11.2026. "Verknüpfungen vorschlagen" liefert R-012 und KPI-AS-02, bestätigen. Speichern, Status Offen. Nummer F-2026-007.
7. **Tab Verlauf:** jede Aktion seit Schritt 4 mit Person, Rolle, Zeit, Hash. KI-Einträge sind markiert.
8. **Rollenwechsel zu Thomas Richter:** Meine Aufgaben zeigt F-2026-007. Annehmen, Ursachenanalyse per KI-Vorschlag, Korrektur "Fußgängerwege in Halle 3 provisorisch markieren" (Aylin Demir, Frist 16.10.2026) und Korrekturmaßnahme "Prüfung der Arbeitsschutzauswirkungen als Pflichtschritt im Änderungsprozess" (Thomas Richter, Frist 13.11.2026). Status In Bearbeitung.
9. **Zurück zu Sandra Keller:** Übrige Punkte über die Demo-Abkürzung als konform markieren (wird als Demo-Aktion geloggt). Berichtserstellung, Berichtsentwurf per KI, freigeben. Bericht ist gesperrt, Hash sichtbar. Bearbeiten ist nur noch als "Neue Version anlegen" mit Begründung möglich. Zum Vergleich A-2026-05 mit Version 1 und 2 zeigen.
10. **Feststellung F-2026-005 (Chemnitz):** Wirksamkeitsprüfung als Keller durchführen. "Schließen" bleibt gesperrt, weil die Bestätigung durch eine zweite Person fehlt.
11. **Verlauf global:** "Integrität prüfen" meldet eine vollständige Kette.
12. **Optional Kataloge:** ISO 45001 10.2 öffnen, gleichwertige Anforderungen zeigen, darunter ISO 50001 10.1. Katalog v2 und v3 vergleichen.

## 15. Arbeitsregeln für Claude Code

- Vor jedem neuen Screen `src/types/domain.ts`, `src/domain/labels.ts` und `src/domain/rules.ts` lesen.
- Fachlogik ausschließlich in `src/domain/`. Komponenten rufen Store-Actions und Selektoren, sie duplizieren keine Guards.
- Neue Felder oder Entitäten nur gemeinsam mit Anpassung von `domain.ts`, Seed, `validate.ts` und dieser Datei. Danach `npm run validate:seed` und `npm run typecheck` ausführen. Beide müssen fehlerfrei sein.
- Keine Normtexte zitieren oder erfinden. Verwendet werden nur Kapitelnummer und Kurztitel aus dem Seed. Normtexte sind urheberrechtlich geschützt (ISO, DIN).
- Keine neuen fachlichen ISO-Regeln erfinden. Bei Unsicherheit `// TODO(fachlich): ...` setzen und nachfragen.
- Kein Backend, kein `fetch`, keine Auth, keine echten Uploads (Uploads simulieren: Dateiname und Größe übernehmen, `sha256` per `demoDigest()`).
- Code und Bezeichner Englisch, Kommentare und UI Deutsch.
- Komponenten klein halten, Richtwert unter 200 Zeilen. Wiederkehrende Elemente als eigene Komponenten: `StatusBadge`, `EntityChip`, `GuardHint`, `ReasonDialog`, `AiSuggestionPanel`, `EvidenceList`, `EvidenceChain`, `EventTimeline`, `HelpHint`, `Panel`.
- Erst funktional durchklickbar, dann gestalten.
- Alle Daten im Seed sind fiktiv. Keine realen Firmen, Personen oder Zertifizierungsstellen ergänzen.
