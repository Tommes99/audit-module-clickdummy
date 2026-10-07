"use client";

import { useMemo, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { SectionTitle, FactList } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { GuardHint } from "@/components/shared/guard-hint";
import { DueText } from "@/components/shared/due-text";
import { EffectivenessBadge } from "@/components/shared/status-badge";
import { DetailEffectivenessPlan } from "@/components/finding/detail-effectiveness-plan";
import { DetailEffectivenessRecord } from "@/components/finding/detail-effectiveness-record";
import { DetailEffectivenessApprove } from "@/components/finding/detail-effectiveness-approve";
import { useFindingRights } from "@/components/finding/detail-rights";
import { FindingTransitionButton } from "@/components/finding/detail-transitions";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import { checkEffectivenessForClosure, requiresCapa } from "@/domain/rules";
import { formatDateTime } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { Finding } from "@/types/domain";

function Step({ no, title, done, children }: { no: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className={cn(
          "tnum mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
          done ? "border-primary bg-primary text-primary-foreground" : "border-primary/50 text-primary",
        )}
      >
        {no}
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium">{title}</p>
        <div className="mt-0.5 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

/** Wer und wann, oder ein Platzhalter, solange der Schritt offen ist */
function WhoWhen({ name, at, open }: { name?: string; at?: string; open: string }) {
  if (!name) return <span>{open}</span>;
  return (
    <span className="text-foreground">
      {name}
      {at && (
        <>
          , <span className="tnum">{formatDateTime(at)}</span>
        </>
      )}
    </span>
  );
}

/** Leerzustand ohne geplante Prüfung: nennt, was als Nächstes zu tun ist und wer es tut */
function emptyText(finding: Finding, canVerify: boolean): string {
  if (finding.status === "closed") return "Für diese Feststellung wurde keine Wirksamkeitsprüfung dokumentiert.";
  if (finding.status !== "in_treatment" && finding.status !== "effectiveness_check") {
    return "Noch keine Wirksamkeitsprüfung geplant. Sie wird geplant, sobald die Feststellung in Bearbeitung ist.";
  }
  return canVerify
    ? "Noch keine Wirksamkeitsprüfung geplant. Legen Sie Termin und Prüfmethode fest."
    : "Noch keine Wirksamkeitsprüfung geplant. Sie planen die Auditprogramm-Verantwortlichen oder das Auditteam.";
}

/** Wirksamkeitsprüfung nach dem Vier-Augen-Prinzip: Durchführung und Bestätigung durch verschiedene Personen */
export function DetailEffectiveness({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const rights = useFindingRights(finding);
  const check = useMemo(() => data.effectivenessChecks.find((c) => c.id === finding.effectivenessCheckId), [data.effectivenessChecks, finding.effectivenessCheckId]);
  const closureBlockers = useMemo(() => checkEffectivenessForClosure(check), [check]);

  if (!requiresCapa(finding.classification)) {
    return (
      <section id="wirksamkeit" aria-label="Wirksamkeitsprüfung" className="scroll-mt-24">
        <SectionTitle help="finding.effectiveness">Wirksamkeitsprüfung</SectionTitle>
        <p className="rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">
          Für diese Klassifizierung ist keine Wirksamkeitsprüfung erforderlich.
        </p>
      </section>
    );
  }

  const inCheck = finding.status === "effectiveness_check";
  const performed = Boolean(check?.performedById);
  const notEffective = check?.result === "not_effective";

  return (
    <section id="wirksamkeit" aria-label="Wirksamkeitsprüfung" className="scroll-mt-24 space-y-3">
      <SectionTitle help="finding.effectiveness">Wirksamkeitsprüfung</SectionTitle>
      {check ? (
        <Panel className="space-y-4">
          <FactList
            items={[
              { label: "Geplanter Termin", value: <DueText dueDate={check.plannedDate} done={performed} /> },
              { label: "Methode", value: check.method },
              { label: "Ergebnis", value: check.result ? <EffectivenessBadge result={check.result} /> : <span className="text-muted-foreground">Offen</span> },
              ...(check.comment ? [{ label: "Kommentar", value: <p>{check.comment}</p> }] : []),
            ]}
          />
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Step no={1} title="Prüfung durchgeführt von" done={performed}>
              <WhoWhen name={performed ? personName(data, check.performedById) : undefined} at={check.performedAt} open="Noch nicht durchgeführt" />
            </Step>
            <Step no={2} title="Bestätigt durch zweite Person" done={Boolean(check.approvedById)}>
              <WhoWhen
                name={check.approvedById ? personName(data, check.approvedById) : undefined}
                at={check.approvedAt}
                open="Offen: muss eine andere Person sein"
              />
            </Step>
          </div>
        </Panel>
      ) : (
        <p className="rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">{emptyText(finding, rights.verify.allowed)}</p>
      )}

      <DetailEffectivenessPlan finding={finding} check={check} />
      {check && inCheck && !performed && <DetailEffectivenessRecord finding={finding} check={check} />}
      {check && inCheck && performed && !notEffective && !check.approvedById && <DetailEffectivenessApprove check={check} />}

      {inCheck && notEffective && (
        <div className="space-y-2 sm:max-w-xl">
          <GuardHint warnings={["Die Maßnahmen waren nicht wirksam. Setzen Sie die Feststellung mit Begründung zurück in Bearbeitung und ergänzen Sie weitere Maßnahmen."]} />
          <FindingTransitionButton finding={finding} to="in_treatment" hideHint />
        </div>
      )}
      {inCheck && !notEffective && closureBlockers.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-foreground">Schließen gesperrt</p>
            {rights.verify.allowed ? (
              <p>Die Blocker stehen oben unter dem Kopf.</p>
            ) : (
              <ul className="list-disc pl-4">
                {closureBlockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
