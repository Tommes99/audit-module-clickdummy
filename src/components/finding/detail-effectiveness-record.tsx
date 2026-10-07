"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { GuardedButton } from "@/components/shared/guarded-button";
import { GuardHint } from "@/components/shared/guard-hint";
import { useFindingRights } from "@/components/finding/detail-rights";
import { useAppStore } from "@/store/app-store";
import { checkEffectivenessRecord } from "@/domain/rules";
import { effectivenessResultLabels } from "@/domain/labels";
import { notify } from "@/lib/notify";
import type { EffectivenessCheck, EffectivenessResult, Finding } from "@/types/domain";

const results: EffectivenessResult[] = ["effective", "not_effective"];

/** Prüfung durchführen: Ergebnis und Kommentar, bei "nicht wirksam" ist der Kommentar Pflicht */
export function DetailEffectivenessRecord({ finding, check }: { finding: Finding; check: EffectivenessCheck }) {
  const recordEffectivenessCheck = useAppStore((s) => s.recordEffectivenessCheck);
  const rights = useFindingRights(finding);
  const [result, setResult] = useState<EffectivenessResult | "">("");
  const [comment, setComment] = useState("");

  const guard = useMemo(() => (result ? checkEffectivenessRecord(finding, check, result, comment) : undefined), [finding, check, result, comment]);
  const denied = rights.verify.allowed ? undefined : rights.verify.reason;

  return (
    <form
      aria-label="Wirksamkeitsprüfung durchführen"
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (result) notify(recordEffectivenessCheck(check.id, result, comment), "Wirksamkeitsprüfung durchgeführt");
      }}
    >
      <p className="text-sm font-semibold">Wirksamkeitsprüfung durchführen</p>
      <fieldset className="space-y-1.5">
        <legend className="text-sm">Ergebnis (Pflichtfeld)</legend>
        <RadioGroup value={result} onValueChange={(v) => setResult(v as EffectivenessResult)} className="gap-2">
          {results.map((r) => (
            <Label key={r} htmlFor={`eff-result-${r}`} className="flex min-h-9 items-center gap-2 font-normal">
              <RadioGroupItem id={`eff-result-${r}`} value={r} />
              {effectivenessResultLabels[r].label}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="eff-comment">{result === "not_effective" ? "Kommentar (Pflichtfeld bei nicht wirksam)" : "Kommentar"}</Label>
        <Textarea id="eff-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <div className="space-y-2">
        <GuardedButton type="submit" blockers={guard?.blockers} deniedReason={denied} disabled={!result}>
          Wirksamkeitsprüfung durchführen
        </GuardedButton>
        {!denied && <GuardHint blockers={guard?.blockers} className="max-w-md" />}
      </div>
    </form>
  );
}
