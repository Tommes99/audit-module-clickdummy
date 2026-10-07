"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/shared/help-hint";
import { verifyChain, type ChainVerification } from "@/lib/audit-trail";
import type { AuditEvent } from "@/types/domain";

/** Prüfergebnis gilt für die Kette zum Zeitpunkt der Prüfung */
export function useIntegrityCheck(events: AuditEvent[]) {
  const [result, setResult] = useState<ChainVerification | null>(null);
  return { result, run: () => setResult(verifyChain(events)) };
}

/** Klare Hauptaktion der Seite, rechts oben im Kopf */
export function IntegrityButton({ onRun }: { onRun: () => void }) {
  return (
    <Button type="button" onClick={onRun}>
      <ShieldCheck aria-hidden /> Integrität prüfen
    </Button>
  );
}

/** Statusbox mit Anzahl geprüfter Einträge und Ergebnis, direkt unter dem Kopf */
export function IntegrityResult({ result }: { result: ChainVerification | null }) {
  if (!result) return null;
  const tone = result.valid ? "border-success/30 bg-success-soft text-success-ink" : "border-danger/30 bg-danger-soft text-danger-ink";
  return (
    <section aria-label="Ergebnis der Integritätsprüfung" role="status" className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 ${tone}`}>
      {result.valid ? <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0" /> : <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0" />}
      <div className="min-w-0 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          {result.valid ? "Kette lückenlos" : "Kette fehlerhaft"}
          <HelpHint topic="trail.integrity" />
        </p>
        <p className="tnum mt-0.5">
          {result.message}
          {!result.valid && result.brokenAt !== undefined && <> Erster fehlerhafter Eintrag: #{result.brokenAt}.</>}
        </p>
      </div>
    </section>
  );
}
