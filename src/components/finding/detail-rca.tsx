"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { AiBadge } from "@/components/shared/status-badge";
import { AiSuggestionPanel, type AiOutput } from "@/components/shared/ai-suggestion-panel";
import { DetailRcaForm, type RcaFormValues } from "@/components/finding/detail-rca-form";
import { useFindingRights } from "@/components/finding/detail-rights";
import { RoleSwitchHint } from "@/components/shared/role-switch-hint";
import { AI_DEMO_AUDIT_NUMBER, rcaEditableStatus } from "@/components/finding/detail-text";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import { formatDateTime, rootCauseMethodLabels } from "@/domain/labels";
import { notify } from "@/lib/notify";
import type { Finding } from "@/types/domain";

const RCA_KEY = "rca-gbu-halle3";

/** Ursachenanalyse: ab Annahme dokumentierbar, gespeicherte Analyse schreibgeschützt mit "Überarbeiten" */
export function DetailRca({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const setRootCause = useAppStore((s) => s.setRootCause);
  const rejectAiSuggestion = useAppStore((s) => s.rejectAiSuggestion);
  const rights = useFindingRights(finding);
  const [editing, setEditing] = useState(false);
  const [prefill, setPrefill] = useState<RcaFormValues | null>(null);

  const rca = finding.rootCauseAnalysis;
  const statusOk = rcaEditableStatus.includes(finding.status);
  const canEdit = statusOk && rights.capa.allowed;
  const formOpen = canEdit && (!rca || editing || prefill !== null);
  const aiAvailable =
    formOpen && rights.audit?.number === AI_DEMO_AUDIT_NUMBER && finding.description.trim().length > 0;
  const target = { entityType: "finding" as const, entityId: finding.id, auditId: finding.auditId, label: finding.number };

  const close = () => {
    setEditing(false);
    setPrefill(null);
  };

  const acceptAi = (output: AiOutput) => {
    const ok = notify(
      setRootCause(finding.id, { method: "five_why", steps: output.steps as string[], rootCause: output.rootCause as string }, RCA_KEY),
      "Ursachenanalyse dokumentiert",
    );
    if (ok) close();
  };
  const editAi = (output: AiOutput) =>
    setPrefill({ method: "five_why", steps: (output.steps as string[]).join("\n"), rootCause: output.rootCause as string, aiKey: RCA_KEY });

  return (
    <section id="ursachenanalyse" aria-label="Ursachenanalyse" className="scroll-mt-24">
      <SectionTitle
        help="finding.rca"
        actions={
          canEdit && rca && !editing ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Überarbeiten
            </Button>
          ) : undefined
        }
      >
        Ursachenanalyse
      </SectionTitle>

      {finding.status === "open" || finding.status === "draft" || finding.status === "rejected" ? (
        <p className="rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">Die Ursachenanalyse folgt auf die Annahme der Feststellung.</p>
      ) : (
        <div className="space-y-3">
          {rca && !formOpen && (
            <Panel className="space-y-2.5 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Methode:</span>
                <span className="font-medium">{rootCauseMethodLabels[rca.method]}</span>
                {rca.aiAssisted && <AiBadge />}
              </p>
              {rca.steps.length > 0 && (
                <ol className="list-decimal space-y-1 pl-5">
                  {rca.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              )}
              <p>
                <span className="text-muted-foreground">Ursache:</span> <span className="font-medium">{rca.rootCause}</span>
              </p>
              <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                {personName(data, rca.analysedById)}, <span className="tnum">{formatDateTime(rca.analysedAt)}</span>
              </p>
            </Panel>
          )}
          {!rca && !canEdit && statusOk && !rights.capa.allowed && (
            <RoleSwitchHint
              permission="edit_capa"
              ctx={rights.ctx}
              lead="Noch keine Ursachenanalyse. Sie dokumentieren die Auditprogramm-Verantwortlichen oder die Verantwortlichen des Prozesses."
            />
          )}
          {!rca && !canEdit && !(statusOk && !rights.capa.allowed) && (
            <p className="text-sm text-muted-foreground">
              {statusOk ? "Noch keine Ursachenanalyse." : "Für diese Feststellung wurde keine Ursachenanalyse dokumentiert."}
            </p>
          )}
          {aiAvailable && (
            <AiSuggestionPanel
              suggestionKey={RCA_KEY}
              triggerLabel="Ursachenanalyse vorschlagen"
              onAccept={acceptAi}
              onEdit={editAi}
              onReject={() => notify(rejectAiSuggestion(RCA_KEY, target), "KI-Vorschlag verworfen")}
            />
          )}
          {formOpen && (
            <DetailRcaForm
              key={prefill ? "ai" : editing ? "edit" : "new"}
              finding={finding}
              initial={prefill ?? undefined}
              onDone={close}
              onCancel={rca || prefill ? close : undefined}
            />
          )}
        </div>
      )}
    </section>
  );
}
