"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuardedButton } from "@/components/shared/guarded-button";
import { GuardHint } from "@/components/shared/guard-hint";
import { SheetSection } from "@/components/finding/finding-sheet-section";
import { useCan } from "@/hooks/use-can";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";
import { createAudit as probeCreateAudit } from "@/store/commands/audit";
import { AuditBasicsFields, AuditRiskFields, AuditScopeFields } from "./audit-create-fields";
import { emptyAuditForm, toAuditDraft, type AuditForm } from "./audit-create-form";

/** Button "Audit planen" mit Sheet. Inhalt nur bei geöffnetem Sheet, damit das Formular beim Schließen zurückgesetzt wird. */
export function AuditCreateButton() {
  const can = useCan();
  const permission = can("plan_audit");
  const [open, setOpen] = useState(false);
  return (
    <>
      <GuardedButton size="sm" onClick={() => setOpen(true)} deniedReason={permission.allowed ? undefined : permission.reason}>
        <Plus aria-hidden /> Audit planen
      </GuardedButton>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-2xl">
          {open && <AuditCreateBody onClose={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function AuditCreateBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const session = useAppStore((s) => s.session);
  const createAudit = useAppStore((s) => s.createAudit);
  const [form, setForm] = useState<AuditForm>(() => emptyAuditForm(session.personId));
  const patch = (p: Partial<AuditForm>) => setForm((f) => ({ ...f, ...p }));

  // Probelauf ohne Speichern: Blocker und Warnungen kommen aus der Fachregel, nicht aus der Komponente
  const { probe, nextNumber } = useMemo(() => {
    const out = probeCreateAudit(data, session, toAuditDraft(form));
    return { probe: out.result, nextNumber: out.data.audits.find((a) => a.id === out.result.createdId)?.number };
  }, [data, session, form]);

  const submit = () => {
    const result = createAudit(toAuditDraft(form));
    if (!result.createdId) return void notify(result);
    const number = useAppStore.getState().data.audits.find((a) => a.id === result.createdId)?.number ?? "";
    notify(result, `Audit ${number} geplant`);
    onClose();
    router.push(`/audits/${result.createdId}`);
  };

  return (
    <>
      <SheetHeader className="border-b border-border pr-12">
        <SheetTitle>Audit planen</SheetTitle>
        <SheetDescription>
          {data.programmes[0]?.title}. Das Audit startet im Status Geplant{nextNumber ? ` und erhält die Nummer ${nextNumber}` : ""}.
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-5">
        <SheetSection step={1} title="Art, Ort und Termin" help="programme.create">
          <AuditBasicsFields form={form} patch={patch} />
        </SheetSection>
        <SheetSection step={2} title="Normen, Prozesse und Ziele">
          <AuditScopeFields form={form} patch={patch} />
        </SheetSection>
        <SheetSection step={3} title="Risikoeinstufung" help="programme.risk">
          <AuditRiskFields form={form} patch={patch} />
        </SheetSection>
      </div>

      <SheetFooter className="border-t border-border bg-card">
        {probe.blockers.length > 0 && (
          <p role="status" className="text-xs text-danger-ink">
            <span className="font-medium">Noch offen:</span> {probe.blockers.join(" ")}
          </p>
        )}
        {probe.warnings.length > 0 && (
          <div className="max-h-24 overflow-y-auto">
            <GuardHint warnings={probe.warnings} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <GuardedButton type="button" blockers={probe.blockers} onClick={submit}>
            Audit planen
          </GuardedButton>
        </div>
      </SheetFooter>
    </>
  );
}
