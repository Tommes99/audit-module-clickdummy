"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiBadge } from "@/components/shared/status-badge";
import { HelpHint } from "@/components/shared/help-hint";
import { EntityChips } from "@/components/shared/entity-chip";
import { findSuggestion } from "@/store/commands/ai";

const SIMULATED_DELAY_MS = 800;

type Output = Record<string, string | string[]>;

const outputLabels: Record<string, string> = {
  title: "Titel",
  description: "Beschreibung",
  rationale: "Begründung",
  steps: "Schritte",
  rootCause: "Ursache",
  summary: "Zusammenfassung",
  conclusion: "Gesamtbewertung",
  strengths: "Stärken",
  riskIds: "Risiken",
  kpiIds: "Kennzahlen",
};

interface AiSuggestionPanelProps {
  /** Schlüssel aus src/data/ai-suggestions.ts */
  suggestionKey: string;
  /** Beschriftung des Auslösers, z. B. "Mit KI formulieren" */
  triggerLabel: string;
  /** Bereits übernommen: zeigt statt des Auslösers das Label "KI-gestützt" */
  accepted?: boolean;
  disabled?: boolean;
  onAccept: (output: Output) => void;
  /** Gesetzt: zusätzlicher Button "Bearbeiten", der den Vorschlag zur Überarbeitung übergibt */
  onEdit?: (output: Output) => void;
  onReject: () => void;
}

function OutputPreview({ output }: { output: Output }) {
  return (
    <dl className="space-y-2 text-sm">
      {Object.entries(output).map(([key, value]) => (
        <div key={key}>
          <dt className="text-xs font-medium text-muted-foreground">{outputLabels[key] ?? key}</dt>
          <dd className="mt-0.5">
            {key === "riskIds" && Array.isArray(value) ? (
              <EntityChips kind="risk" ids={value} />
            ) : key === "kpiIds" && Array.isArray(value) ? (
              <EntityChips kind="kpi" ids={value} />
            ) : Array.isArray(value) ? (
              <ul className="list-disc space-y-0.5 pl-5">
                {value.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            ) : (
              <p>{value}</p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Simulierte KI-Funktion (kein API-Aufruf): Ladezustand ca. 800 ms, danach Vorschlag in einem
 * abgesetzten Bereich mit Hinweistext und den Optionen Übernehmen, Bearbeiten und Verwerfen.
 * Die Entscheidung wird vom Elternteil über Store-Actions im Verlauf protokolliert.
 */
export function AiSuggestionPanel({ suggestionKey, triggerLabel, accepted, disabled, onAccept, onEdit, onReject }: AiSuggestionPanelProps) {
  const [phase, setPhase] = useState<"idle" | "loading" | "shown">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const suggestion = findSuggestion(suggestionKey);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (accepted) return <AiBadge />;
  if (!suggestion) return null;

  const start = () => {
    setPhase("loading");
    timer.current = setTimeout(() => setPhase("shown"), SIMULATED_DELAY_MS);
  };
  const output = suggestion.output as Output;

  if (phase === "idle") {
    return (
      <span className="inline-flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={start} disabled={disabled}>
          <Sparkles aria-hidden /> {triggerLabel}
        </Button>
        <HelpHint topic="finding.ai" />
      </span>
    );
  }
  if (phase === "loading") {
    return (
      <p role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> KI-Vorschlag wird erstellt
      </p>
    );
  }
  const finish = (fn: () => void) => () => {
    setPhase("idle");
    fn();
  };
  return (
    <section
      aria-label="KI-Vorschlag"
      className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-info-soft/50 p-3.5"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <AiBadge />
        <HelpHint topic="finding.ai" />
        <span className="text-xs text-muted-foreground">{suggestion.disclaimer}</span>
      </div>
      <OutputPreview output={output} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={finish(() => onAccept(output))}>
          Übernehmen
        </Button>
        {onEdit && (
          <Button type="button" size="sm" variant="outline" onClick={finish(() => onEdit(output))}>
            Bearbeiten
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={finish(onReject)}>
          Verwerfen
        </Button>
      </div>
    </section>
  );
}

export type { Output as AiOutput };
