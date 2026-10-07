"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiBadge } from "@/components/shared/status-badge";
import { NativeSelect } from "@/components/shared/native-select";
import { useAppStore } from "@/store/app-store";
import { rootCauseMethodLabels } from "@/domain/labels";
import { notify } from "@/lib/notify";
import type { Finding, RootCauseMethod } from "@/types/domain";

export interface RcaFormValues {
  method: RootCauseMethod;
  /** Eine Zeile je Schritt */
  steps: string;
  rootCause: string;
  /** Gesetzt, wenn der Inhalt aus einem KI-Vorschlag stammt */
  aiKey?: string;
}

const methodOptions = (Object.keys(rootCauseMethodLabels) as RootCauseMethod[]).map((m) => ({ value: m, label: rootCauseMethodLabels[m] }));

/** Formular für die Ursachenanalyse. Mit "key" neu einhängen, wenn ein Vorschlag zur Bearbeitung übergeben wird. */
export function DetailRcaForm({
  finding,
  initial,
  onDone,
  onCancel,
}: {
  finding: Finding;
  initial?: RcaFormValues;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const setRootCause = useAppStore((s) => s.setRootCause);
  const existing = finding.rootCauseAnalysis;
  const start: RcaFormValues = initial ?? {
    method: existing?.method ?? "five_why",
    steps: existing?.steps.join("\n") ?? "",
    rootCause: existing?.rootCause ?? "",
  };
  const [method, setMethod] = useState<RootCauseMethod>(start.method);
  const [steps, setSteps] = useState(start.steps);
  const [rootCause, setRootCauseText] = useState(start.rootCause);

  const save = () => {
    const lines = steps.split("\n").map((s) => s.trim()).filter(Boolean);
    const ok = notify(setRootCause(finding.id, { method, steps: lines, rootCause }, initial?.aiKey), "Ursachenanalyse dokumentiert");
    if (ok) onDone();
  };

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">Ursachenanalyse dokumentieren</p>
        {initial?.aiKey && <AiBadge />}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rca-method">Methode</Label>
        <NativeSelect id="rca-method" value={method} onChange={(v) => setMethod(v as RootCauseMethod)} options={methodOptions} className="sm:max-w-xs" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rca-steps">Schritte (eine Zeile je Schritt)</Label>
        <Textarea
          id="rca-steps"
          rows={5}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder={method === "five_why" ? "Warum ist das passiert? Antwort. Warum? Antwort. …" : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rca-cause">Ursache (Pflichtfeld)</Label>
        <Textarea id="rca-cause" rows={2} value={rootCause} onChange={(e) => setRootCauseText(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!rootCause.trim()}>
          Ursachenanalyse speichern
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
