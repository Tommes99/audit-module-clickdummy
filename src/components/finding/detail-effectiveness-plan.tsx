"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFindingRights } from "@/components/finding/detail-rights";
import { useAppStore } from "@/store/app-store";
import { notify } from "@/lib/notify";
import type { EffectivenessCheck, Finding } from "@/types/domain";

/** Prüfung planen: nur in Bearbeitung oder Wirksamkeitsprüfung, solange keine laufende Prüfung existiert */
export function DetailEffectivenessPlan({ finding, check }: { finding: Finding; check: EffectivenessCheck | undefined }) {
  const planEffectivenessCheck = useAppStore((s) => s.planEffectivenessCheck);
  const rights = useFindingRights(finding);
  const [plannedDate, setPlannedDate] = useState("");
  const [method, setMethod] = useState("");

  const statusOk = finding.status === "in_treatment" || finding.status === "effectiveness_check";
  const needsPlan = !check || check.result === "not_effective";
  if (!statusOk || !needsPlan || !rights.verify.allowed) return null;

  return (
    <form
      aria-label="Wirksamkeitsprüfung planen"
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (notify(planEffectivenessCheck(finding.id, plannedDate, method), "Wirksamkeitsprüfung geplant")) {
          setPlannedDate("");
          setMethod("");
        }
      }}
    >
      <p className="text-sm font-semibold">{check ? "Neue Wirksamkeitsprüfung planen" : "Wirksamkeitsprüfung planen"}</p>
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="eff-date">Termin</Label>
          <Input id="eff-date" type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="tnum" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eff-method">Prüfmethode</Label>
          <Textarea id="eff-method" rows={2} value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={!plannedDate || !method.trim()}>
        Wirksamkeitsprüfung planen
      </Button>
    </form>
  );
}
