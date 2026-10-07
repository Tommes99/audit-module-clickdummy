"use client";

import { useMemo } from "react";
import { SectionTitle } from "@/components/shared/page-header";
import { GuardHint } from "@/components/shared/guard-hint";
import { DetailActionRow } from "@/components/finding/detail-action-row";
import { DetailActionForm } from "@/components/finding/detail-action-form";
import { useAppStore } from "@/store/app-store";
import { actionChangeLockedBy, requiresCapa } from "@/domain/rules";
import type { ActionKind, Finding } from "@/types/domain";

interface Group {
  kind: ActionKind;
  heading: string;
  /** Kurzer Zusatz im Gruppenkopf: was die Art bewirkt */
  effect: string;
  empty: string;
}

/** Drei getrennte Gruppen: Korrektur und Korrekturmaßnahme werden nie vermischt */
const groups: Group[] = [
  { kind: "correction", heading: "Korrekturen (Sofortmaßnahmen)", effect: "Beseitigt das Symptom", empty: "Noch keine Korrektur. Legen Sie eine über „Maßnahme anlegen“ an." },
  { kind: "corrective_action", heading: "Korrekturmaßnahmen", effect: "Beseitigt die Ursache", empty: "Noch keine Korrekturmaßnahme. Legen Sie eine über „Maßnahme anlegen“ an." },
  { kind: "improvement", heading: "Verbesserungsmaßnahmen", effect: "Setzt das Potenzial um", empty: "" },
];

export function DetailActions({ finding }: { finding: Finding }) {
  const allActions = useAppStore((s) => s.data.actions);
  const actions = useMemo(() => allActions.filter((a) => finding.actionIds.includes(a.id)), [allActions, finding.actionIds]);
  const capa = requiresCapa(finding.classification);

  const correctionsOnly =
    capa &&
    finding.status === "accepted" &&
    actions.some((a) => a.kind === "correction") &&
    !actions.some((a) => a.kind === "corrective_action");

  return (
    <section id="massnahmen" aria-label="Maßnahmen" className="scroll-mt-24 space-y-3">
      <SectionTitle help="finding.actions" count={actions.length}>
        Korrektur und Korrekturmaßnahmen
      </SectionTitle>
      {correctionsOnly && (
        <GuardHint
          warnings={["Für „In Bearbeitung“ ist mindestens eine Korrekturmaßnahme nötig. Eine Korrektur allein beseitigt die Ursache nicht."]}
        />
      )}
      {groups.map((g) => {
        const list = actions.filter((a) => a.kind === g.kind);
        // Verbesserungsmaßnahmen nur zeigen, wenn vorhanden oder bei Beobachtung und Verbesserungspotenzial
        const relevant = g.kind !== "improvement" || list.length > 0 || (!capa && finding.classification !== "positive");
        if (!relevant) return null;
        // Bei Feststellungen ohne CAPA nur Gruppen mit Inhalt, außer es gibt gar keine Maßnahme
        if (!capa && list.length === 0 && g.kind !== "improvement") return null;
        return (
          <div key={g.kind} className="overflow-hidden rounded-lg border border-border bg-card">
            <h3 className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-border bg-muted/40 px-3 py-2 text-[13px] font-semibold">
              {g.heading}
              <span className="text-xs font-normal text-muted-foreground">{g.effect}</span>
            </h3>
            {list.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted-foreground">
                {actionChangeLockedBy(finding).length > 0
                  ? "Keine."
                  : g.empty || "Noch keine Verbesserungsmaßnahme. Legen Sie sie an, wenn das Potenzial umgesetzt wird."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((a) => (
                  <DetailActionRow key={a.id} action={a} finding={finding} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {actions.length === 0 && finding.classification === "positive" && (
        <p className="text-sm text-muted-foreground">Für positive Feststellungen sind keine Maßnahmen vorgesehen.</p>
      )}
      <DetailActionForm finding={finding} />
    </section>
  );
}
