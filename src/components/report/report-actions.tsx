"use client";

import { useAppStore } from "@/store/app-store";
import { useCan } from "@/hooks/use-can";
import { notify } from "@/lib/notify";
import { checkReportTransition } from "@/domain/rules";
import { GuardedButton } from "@/components/shared/guarded-button";
import { TransitionButton } from "@/components/shared/transition-button";
import type { Audit, AuditReport } from "@/types/domain";

interface ReportActionsProps {
  audit: Audit;
  report: AuditReport;
  /** Ungespeicherte Änderungen im Entwurf blockieren das Einreichen */
  dirty: boolean;
  /** Nach Anlegen einer neuen Version wieder auf die aktuelle Version springen */
  onVersionCreated: () => void;
}

/** Offene Blocker für den nächsten Schritt: Einreichen (Entwurf) oder Freigeben (In Prüfung). Die Regeln stehen in rules.ts. */
export function reportActionBlockers(report: AuditReport, dirty: boolean): string[] {
  if (report.status === "draft") return [...checkReportTransition(report, "in_review").blockers, ...(dirty ? ["Änderungen zuerst speichern."] : [])];
  if (report.status === "in_review") return checkReportTransition(report, "released").blockers;
  return [];
}

/** Statusbezogene Aktion (immer nur der erlaubte nächste Schritt): einreichen, freigeben oder neue Version anlegen. Die Blocker zeigt der Aufrufer als Hinweis. */
export function ReportActions({ audit, report, dirty, onVersionCreated }: ReportActionsProps) {
  const can = useCan();
  const submitReport = useAppStore((s) => s.submitReport);
  const returnReportToDraft = useAppStore((s) => s.returnReportToDraft);
  const releaseReport = useAppStore((s) => s.releaseReport);
  const transitionAudit = useAppStore((s) => s.transitionAudit);
  const createReportVersion = useAppStore((s) => s.createReportVersion);

  const editRight = can("edit_checklist", { audit });
  const releaseRight = can("release_report", { audit });
  const blockers = reportActionBlockers(report, dirty);

  if (report.status === "draft") {
    return (
      <TransitionButton
        label="Zur Prüfung einreichen"
        run={() => submitReport(report.id)}
        successMessage="Bericht zur Prüfung eingereicht"
        blockers={blockers}
        deniedReason={editRight.allowed ? undefined : editRight.reason}
      />
    );
  }

  if (report.status === "in_review") {
    // Erst den Bericht freigeben, danach (nur wenn nötig) das Audit. Beide Ergebnisse werden gemeldet.
    const release = () => {
      if (!notify(releaseReport(report.id), "Bericht freigegeben")) return;
      if (audit.status === "reporting") notify(transitionAudit(audit.id, "released"));
    };
    return (
      <div className="flex flex-wrap items-center gap-2">
        <GuardedButton type="button" onClick={release} blockers={blockers} deniedReason={releaseRight.allowed ? undefined : releaseRight.reason}>
          Bericht freigeben
        </GuardedButton>
        <TransitionButton
          label="Zurück in den Entwurf"
          variant="outline"
          run={(reason) => returnReportToDraft(report.id, reason ?? "")}
          successMessage="Bericht zurück in den Entwurf gesetzt"
          deniedReason={editRight.allowed ? undefined : editRight.reason}
          reasonDialog={{
            title: "Bericht zurück in den Entwurf",
            description: "Der Bericht wird wieder bearbeitbar. Die Begründung wird im Verlauf festgehalten.",
            confirmLabel: "Zurück in den Entwurf",
          }}
        />
      </div>
    );
  }

  if (report.status === "released") {
    return (
      <TransitionButton
        label="Neue Version anlegen"
        variant="outline"
        run={(reason) => createReportVersion(report.id, reason ?? "")}
        successMessage="Neue Version angelegt"
        deniedReason={releaseRight.allowed ? undefined : releaseRight.reason}
        onDone={onVersionCreated}
        reasonDialog={{
          title: "Neue Version des Berichts anlegen",
          description: "Die freigegebene Version bleibt unverändert sichtbar und erhält den Status Ersetzt. Die neue Version startet als Entwurf.",
          confirmLabel: "Neue Version anlegen",
        }}
      />
    );
  }
  return null;
}
