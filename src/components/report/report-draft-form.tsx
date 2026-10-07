"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { notify } from "@/lib/notify";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GuardedButton } from "@/components/shared/guarded-button";
import { GuardHint } from "@/components/shared/guard-hint";
import { Panel } from "@/components/shared/panel";
import { AiBadge } from "@/components/shared/status-badge";
import type { AuditReport } from "@/types/domain";

const toLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

interface ReportDraftFormProps {
  report: AuditReport;
  /** Fehlende Berechtigung zum Bearbeiten (nur UI) */
  deniedReason?: string;
  /** Meldet dem Elternteil, ob ungespeicherte Änderungen vorliegen */
  onDirtyChange: (dirty: boolean) => void;
}

/** Bearbeitbare Felder eines Berichtsentwurfs. Mit key={report.id} einbinden, damit der Zustand je Version neu startet. */
export function ReportDraftForm({ report, deniedReason, onDirtyChange }: ReportDraftFormProps) {
  const updateReportDraft = useAppStore((s) => s.updateReportDraft);
  const [summary, setSummary] = useState(report.summary);
  const [conclusion, setConclusion] = useState(report.conclusion);
  const [strengths, setStrengths] = useState(report.strengths.join("\n"));

  const dirty = summary !== report.summary || conclusion !== report.conclusion || JSON.stringify(toLines(strengths)) !== JSON.stringify(report.strengths);
  const readOnly = Boolean(deniedReason);

  const change = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    onDirtyChange(true);
  };
  const save = () => {
    const ok = notify(updateReportDraft(report.id, { summary: summary.trim(), conclusion: conclusion.trim(), strengths: toLines(strengths) }), "Änderungen gespeichert");
    if (ok) onDirtyChange(false);
  };

  return (
    <Panel className="space-y-5 p-5">
      {report.aiAssisted && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <AiBadge /> Prüfen und überarbeiten Sie den Entwurf vor der Freigabe.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="rep-summary">Zusammenfassung</Label>
        <Textarea id="rep-summary" rows={5} className="max-w-[72ch] leading-relaxed" value={summary} readOnly={readOnly} onChange={change(setSummary)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rep-conclusion">Gesamtbewertung</Label>
        <Textarea id="rep-conclusion" rows={5} className="max-w-[72ch] leading-relaxed" value={conclusion} readOnly={readOnly} onChange={change(setConclusion)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rep-strengths">Stärken (eine pro Zeile)</Label>
        <Textarea id="rep-strengths" rows={4} className="max-w-[72ch] leading-relaxed" value={strengths} readOnly={readOnly} onChange={change(setStrengths)} />
      </div>
      <div className="space-y-2">
        <GuardedButton type="button" variant="outline" onClick={save} disabled={!dirty} deniedReason={deniedReason}>
          Änderungen speichern
        </GuardedButton>
        {dirty && <GuardHint warnings={["Ungespeicherte Änderungen. Speichern Sie, bevor Sie den Bericht zur Prüfung einreichen."]} />}
      </div>
    </Panel>
  );
}
