"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GuardedButton } from "@/components/shared/guarded-button";
import { GuardHint } from "@/components/shared/guard-hint";
import { RoleSwitchHint } from "@/components/shared/role-switch-hint";
import { NativeSelect } from "@/components/shared/native-select";
import { useFindingRights } from "@/components/finding/detail-rights";
import { useAppStore } from "@/store/app-store";
import { createAction as probeCreateAction } from "@/store/commands/capa";
import { actionChangeLockedBy, requiresCapa } from "@/domain/rules";
import { DEMO_TODAY } from "@/domain/workflows";
import { actionKindLabels, actionKindShortLabels } from "@/domain/labels";
import { notify } from "@/lib/notify";
import type { ActionKind, Finding } from "@/types/domain";

/** Welche Arten bei welcher Klassifizierung angelegt werden dürfen: Korrektur und Korrekturmaßnahme bleiben getrennt */
function kindsFor(finding: Finding): ActionKind[] {
  if (requiresCapa(finding.classification)) return ["correction", "corrective_action"];
  if (finding.classification === "positive") return [];
  return ["correction", "corrective_action", "improvement"];
}

export function DetailActionForm({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const session = useAppStore((s) => s.session);
  const createAction = useAppStore((s) => s.createAction);
  const rights = useFindingRights(finding);
  const kinds = kindsFor(finding);
  const capa = requiresCapa(finding.classification);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ActionKind>(capa ? "corrective_action" : "improvement");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");

  /** Probelauf der Action ohne Speichern: liefert die Statusblocker aus der Store-Logik, ohne sie hier zu duplizieren */
  const statusBlockers = useMemo(
    () =>
      probeCreateAction(data, session, {
        source: { type: "finding", id: finding.id },
        kind: "correction",
        title: "Probe",
        description: "",
        ownerId: session.personId,
        dueDate: DEMO_TODAY,
      }).result.blockers,
    [data, session, finding.id],
  );

  // In der Wirksamkeitsprüfung und nach dem Schließen gibt es keine neuen Maßnahmen, der Button entfällt
  if (kinds.length === 0 || actionChangeLockedBy(finding).length > 0) return null;

  const submit = () => {
    const result = createAction({ source: { type: "finding", id: finding.id }, kind, title, description, ownerId, dueDate });
    if (notify(result, `${actionKindShortLabels[kind]} angelegt`)) {
      setTitle("");
      setDescription("");
      setOwnerId("");
      setDueDate("");
      setOpen(false);
    }
  };

  const denied = rights.capa.allowed ? undefined : rights.capa.reason;
  if (!open) {
    return (
      <div className="space-y-2">
        <GuardedButton type="button" variant="outline" size="sm" blockers={statusBlockers} deniedReason={denied} onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Maßnahme anlegen
        </GuardedButton>
        {denied ? (
          <RoleSwitchHint
            permission="edit_capa"
            ctx={rights.ctx}
            lead="Maßnahmen legen die Auditprogramm-Verantwortlichen, die Auditees des Prozesses und Maßnahmenverantwortliche an. Ihre Rolle liest mit."
          />
        ) : (
          <GuardHint blockers={statusBlockers} className="max-w-md" />
        )}
      </div>
    );
  }

  return (
    <form
      aria-label="Maßnahme anlegen"
      className="space-y-3 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="text-sm font-semibold">Maßnahme anlegen</p>
      <div className="space-y-1.5">
        <Label htmlFor="action-kind">Art</Label>
        <NativeSelect
          id="action-kind"
          value={kind}
          onChange={(v) => setKind(v as ActionKind)}
          options={kinds.map((k) => ({ value: k, label: actionKindLabels[k] }))}
          className="sm:max-w-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="action-title">Titel (Pflichtfeld)</Label>
        <Input id="action-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="action-description">Beschreibung</Label>
        <Textarea id="action-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="action-owner">Verantwortliche:r (Pflichtfeld)</Label>
          <NativeSelect
            id="action-owner"
            value={ownerId}
            onChange={setOwnerId}
            placeholder="Bitte wählen"
            options={data.persons.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action-due">Frist (Pflichtfeld)</Label>
          <Input id="action-due" type="date" min={DEMO_TODAY} max="2100-12-31" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="tnum" />
        </div>
      </div>
      <GuardHint blockers={statusBlockers} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!title.trim() || !ownerId || !dueDate || statusBlockers.length > 0}>
          Maßnahme anlegen
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
