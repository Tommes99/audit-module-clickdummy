"use client";

import { useAppStore } from "@/store/app-store";
import { useCan } from "@/hooks/use-can";
import { notify } from "@/lib/notify";
import { rejectionTarget } from "@/components/report/report-ai";
import { findSuggestion } from "@/store/commands/ai";
import { reportAiKey } from "@/store/commands/report";
import { AiSuggestionPanel } from "@/components/shared/ai-suggestion-panel";
import { GuardedButton } from "@/components/shared/guarded-button";
import { EmptyState, SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import type { Audit } from "@/types/domain";

/** Zustand ohne Bericht: Entwurf per KI-Vorschlag oder leer anlegen, solange das Audit in der Berichtserstellung ist */
export function ReportCreate({ audit }: { audit: Audit }) {
  const can = useCan();
  const createReportDraft = useAppStore((s) => s.createReportDraft);
  const rejectAiSuggestion = useAppStore((s) => s.rejectAiSuggestion);
  const right = can("edit_checklist", { audit });
  const key = reportAiKey(audit.number);

  if (audit.status !== "reporting") {
    return (
      <EmptyState>
        {audit.status === "released" || audit.status === "closed"
          ? "Zu diesem Audit liegt kein Bericht vor."
          : "Der Bericht wird in der Berichtserstellung angelegt. Starten Sie die Berichtserstellung in der Übersicht, sobald alle Checklistenpunkte bewertet sind."}
      </EmptyState>
    );
  }

  const create = (fromAi: boolean) => notify(createReportDraft(audit.id, fromAi), "Berichtsentwurf erzeugt");

  return (
    <section className="space-y-3">
      <SectionTitle help="audit.report">Bericht</SectionTitle>
      <Panel className="space-y-4">
        <p className="text-sm">Noch kein Bericht. Erzeugen Sie einen Entwurf, per KI-Vorschlag oder leer.</p>
        <div className="flex flex-wrap items-start gap-3">
          {findSuggestion(key) && (
            <div className="min-w-72 max-w-2xl flex-1">
              <AiSuggestionPanel
                suggestionKey={key}
                triggerLabel="Berichtsentwurf erzeugen"
                disabled={!right.allowed}
                onAccept={() => create(true)}
                onEdit={() => create(true)}
                onReject={() => notify(rejectAiSuggestion(key, rejectionTarget(audit)), "KI-Vorschlag verworfen")}
              />
            </div>
          )}
          <GuardedButton type="button" variant="outline" onClick={() => create(false)} deniedReason={right.allowed ? undefined : right.reason}>
            Leeren Entwurf anlegen
          </GuardedButton>
        </div>
      </Panel>
    </section>
  );
}
