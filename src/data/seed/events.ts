import type { AuditEventDraft } from "@/types/domain";
import { buildEventChain } from "@/lib/audit-trail";

/**
 * Historie bis zum Demo-Tag. Neue Events entstehen in der App über appendEvent().
 * Die Kette wird beim Laden gebaut, verifyChain() muss für den Seed "gültig" liefern.
 */

const d = (e: Omit<AuditEventDraft, "aiGenerated"> & { aiGenerated?: boolean }): AuditEventDraft => ({
  aiGenerated: false,
  ...e,
});

const drafts: AuditEventDraft[] = [
  // Programm
  d({ timestamp: "2026-01-12T10:00:00+01:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "programme", entityId: "prog-2026", action: "created", summary: "Auditprogramm 2026 angelegt" }),
  d({ timestamp: "2026-01-15T11:00:00+01:00", actorId: "p-schulz", actorRole: "management", entityType: "programme", entityId: "prog-2026", action: "status_changed", summary: "Auditprogramm 2026 freigegeben", changes: [{ field: "status", before: "draft", after: "approved" }] }),

  // A-2026-01
  d({ timestamp: "2026-01-12T10:30:00+01:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "audit", entityId: "aud-2026-01", auditId: "aud-2026-01", action: "created", summary: "Audit A-2026-01 geplant" }),
  d({ timestamp: "2026-02-17T10:20:00+01:00", actorId: "p-keller", actorRole: "auditor", entityType: "finding", entityId: "f-2026-001", auditId: "aud-2026-01", action: "created", summary: "Nebenabweichung F-2026-001 erfasst" }),
  d({ timestamp: "2026-02-25T16:00:00+01:00", actorId: "p-keller", actorRole: "auditor", entityType: "report", entityId: "rep-2026-01-v1", auditId: "aud-2026-01", action: "released", summary: "Auditbericht A-2026-01 Version 1 freigegeben" }),
  d({ timestamp: "2026-05-11T13:00:00+02:00", actorId: "p-hoffmann", actorRole: "auditor", entityType: "effectiveness_check", entityId: "eff-001", auditId: "aud-2026-01", action: "updated", summary: "Wirksamkeitsprüfung zu F-2026-001 durchgeführt: wirksam", changes: [{ field: "result", before: null, after: "effective" }] }),
  d({ timestamp: "2026-05-12T10:00:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "effectiveness_check", entityId: "eff-001", auditId: "aud-2026-01", action: "released", summary: "Wirksamkeitsprüfung zu F-2026-001 durch zweite Person bestätigt" }),
  d({ timestamp: "2026-05-12T10:01:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "finding", entityId: "f-2026-001", auditId: "aud-2026-01", action: "status_changed", summary: "F-2026-001 geschlossen", changes: [{ field: "status", before: "effectiveness_check", after: "closed" }] }),
  d({ timestamp: "2026-05-12T10:05:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "audit", entityId: "aud-2026-01", auditId: "aud-2026-01", action: "status_changed", summary: "Audit A-2026-01 abgeschlossen", changes: [{ field: "status", before: "released", after: "closed" }] }),

  // A-2026-03 extern
  d({ timestamp: "2026-05-06T15:10:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "finding", entityId: "f-2026-004", auditId: "aud-2026-03", action: "created", summary: "Nebenabweichung F-2026-004 aus Bericht der Zertifizierungsstelle übernommen" }),
  d({ timestamp: "2026-05-20T08:45:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "evidence", entityId: "ev-03-01", auditId: "aud-2026-03", action: "evidence_attached", summary: "Originalbericht der Zertifizierungsstelle hochgeladen" }),
  d({ timestamp: "2026-05-20T09:30:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "report", entityId: "rep-2026-03-v1", auditId: "aud-2026-03", action: "released", summary: "Zusammenfassung Überwachungsaudit freigegeben" }),
  d({ timestamp: "2026-05-21T10:00:00+02:00", actorId: "p-koch", actorRole: "auditee", entityType: "finding", entityId: "f-2026-004", auditId: "aud-2026-03", action: "status_changed", summary: "F-2026-004 angenommen", changes: [{ field: "status", before: "open", after: "accepted" }] }),
  d({ timestamp: "2026-05-28T13:30:00+02:00", actorId: "p-koch", actorRole: "action_owner", entityType: "finding", entityId: "f-2026-004", auditId: "aud-2026-03", action: "status_changed", summary: "Ursachenanalyse dokumentiert, F-2026-004 in Bearbeitung", changes: [{ field: "status", before: "accepted", after: "in_treatment" }] }),
  d({ timestamp: "2026-06-26T15:10:00+02:00", actorId: "p-koch", actorRole: "action_owner", entityType: "action", entityId: "act-003", auditId: "aud-2026-03", action: "status_changed", summary: "Maßnahme M-2026-003 erledigt", changes: [{ field: "status", before: "in_progress", after: "done" }] }),

  // A-2026-05 inkl. KI-Unterstützung und Berichtsversion 2
  d({ timestamp: "2026-06-23T11:20:00+02:00", actorId: "p-keller", actorRole: "auditor", entityType: "finding", entityId: "f-2026-005", auditId: "aud-2026-05", action: "ai_suggestion_accepted", summary: "Feststellungstext F-2026-005 aus Stichpunkten per KI formuliert, geprüft und übernommen", aiGenerated: true }),
  d({ timestamp: "2026-06-26T10:00:00+02:00", actorId: "p-keller", actorRole: "auditor", entityType: "report", entityId: "rep-2026-05-v1", auditId: "aud-2026-05", action: "ai_suggestion_accepted", summary: "Berichtsentwurf A-2026-05 per KI aus Auditdaten erzeugt, überarbeitet und übernommen", aiGenerated: true }),
  d({ timestamp: "2026-07-01T12:00:00+02:00", actorId: "p-keller", actorRole: "auditor", entityType: "report", entityId: "rep-2026-05-v1", auditId: "aud-2026-05", action: "released", summary: "Auditbericht A-2026-05 Version 1 freigegeben" }),
  d({ timestamp: "2026-07-07T09:00:00+02:00", actorId: "p-keller", actorRole: "auditor", entityType: "report", entityId: "rep-2026-05-v2", auditId: "aud-2026-05", action: "version_created", summary: "Auditbericht A-2026-05 Version 2 angelegt, Version 1 ersetzt", reason: "Klassifizierung von F-2026-006 nach Rückmeldung der Auditee korrigiert.", changes: [{ field: "F-2026-006.classification", before: "observation", after: "opportunity" }] }),
  d({ timestamp: "2026-07-08T11:00:00+02:00", actorId: "p-keller", actorRole: "auditor", entityType: "report", entityId: "rep-2026-05-v2", auditId: "aud-2026-05", action: "released", summary: "Auditbericht A-2026-05 Version 2 freigegeben" }),
  d({ timestamp: "2026-08-19T10:05:00+02:00", actorId: "p-hoffmann", actorRole: "action_owner", entityType: "action", entityId: "act-005", auditId: "aud-2026-05", action: "status_changed", summary: "Maßnahme M-2026-005 erledigt", changes: [{ field: "status", before: "in_progress", after: "done" }] }),
  d({ timestamp: "2026-08-19T10:10:00+02:00", actorId: "p-hoffmann", actorRole: "action_owner", entityType: "finding", entityId: "f-2026-005", auditId: "aud-2026-05", action: "status_changed", summary: "F-2026-005 zur Wirksamkeitsprüfung", changes: [{ field: "status", before: "in_treatment", after: "effectiveness_check" }] }),

  // Katalog v3
  d({ timestamp: "2026-07-15T09:00:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "catalog", entityId: "cat-umas-v3", action: "version_created", summary: "Fragenkatalog Kombi-Audit UM/AS Version 3 freigegeben, Version 2 außer Kraft", reason: "Frage zum Management von Veränderungen ergänzt." }),

  // A-2026-09 Demo-Audit
  d({ timestamp: "2026-08-20T14:00:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "audit", entityId: "aud-2026-09", auditId: "aud-2026-09", action: "created", summary: "Audit A-2026-09 geplant, Risikoeinstufung hoch" }),
  d({ timestamp: "2026-08-20T14:05:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "audit", entityId: "aud-2026-09", auditId: "aud-2026-09", action: "assigned", summary: "Michael Wagner als Co-Auditor zugewiesen", changes: [{ field: "auditorIds", before: ["p-keller"], after: ["p-keller", "p-wagner"] }] }),
  d({ timestamp: "2026-09-29T10:00:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "audit", entityId: "aud-2026-09", auditId: "aud-2026-09", action: "status_changed", summary: "Audit A-2026-09 in Vorbereitung", changes: [{ field: "status", before: "planned", after: "in_preparation" }] }),
  d({ timestamp: "2026-09-29T10:01:00+02:00", actorId: "p-keller", actorRole: "programme_manager", entityType: "checklist", entityId: "chk-2026-09", auditId: "aud-2026-09", action: "created", summary: "Checkliste aus Katalog Version 3 erzeugt, offene Feststellung F-2026-004 übernommen" }),
  d({ timestamp: "2026-10-01T14:30:00+02:00", actorId: "p-koch", actorRole: "auditee", entityType: "evidence", entityId: "ev-09-02", auditId: "aud-2026-09", action: "evidence_attached", summary: "Rechtskataster Leipzig als Nachweis bereitgestellt" }),
  d({ timestamp: "2026-10-02T09:00:00+02:00", actorId: "p-richter", actorRole: "auditee", entityType: "evidence", entityId: "ev-09-01", auditId: "aud-2026-09", action: "evidence_attached", summary: "Gefährdungsbeurteilung Halle 3 als Nachweis bereitgestellt" }),
];

export const events = buildEventChain(drafts);
