"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared/panel";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/page-header";
import { ReqChips } from "@/components/catalogs/req-chip";
import { QuestionSheet } from "@/components/catalogs/question-sheet";
import { useCan } from "@/hooks/use-can";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";
import type { CatalogQuestion, QuestionCatalog } from "@/types/domain";

/** Fragen mit Anforderungs-Chips. Im Entwurf (und mit Recht) bearbeitbar: ändern, verschieben, entfernen, ergänzen. */
export function QuestionTable({ catalog }: { catalog: QuestionCatalog }) {
  const can = useCan();
  const move = useAppStore((s) => s.moveCatalogQuestion);
  const remove = useAppStore((s) => s.removeCatalogQuestion);
  const editable = catalog.status === "draft" && can("manage_catalog").allowed;
  const [sheet, setSheet] = useState<{ question?: CatalogQuestion } | null>(null);
  const [removing, setRemoving] = useState<CatalogQuestion | null>(null);

  const add = (
    <Button size="sm" onClick={() => setSheet({})}>
      <Plus aria-hidden /> Frage ergänzen
    </Button>
  );

  return (
    <div className="space-y-3">
      {editable && <div className="flex justify-end">{add}</div>}
      {catalog.questions.length === 0 ? (
        <EmptyState action={editable ? add : undefined}>Der Katalog hat noch keine Fragen. Ergänzen Sie mindestens eine Frage mit zugeordneter Anforderung.</EmptyState>
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="w-12 px-3 py-2 font-medium">Nr.</th>
                  <th scope="col" className="px-3 py-2 font-medium">Frage</th>
                  <th scope="col" className="w-[34%] px-3 py-2 font-medium">Anforderungen</th>
                  {editable && <th scope="col" className="w-36 px-3 py-2 font-medium"><span className="sr-only">Aktionen</span></th>}
                </tr>
              </thead>
              <tbody>
                {catalog.questions.map((q, i) => (
                  <tr key={q.id} className="border-b border-border align-top last:border-0">
                    <td className="tnum px-3 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-3">
                      <p>{q.text}</p>
                      {q.guidance && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">Hinweis:</span> {q.guidance}
                        </p>
                      )}
                      {q.evidenceHint && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">Typische Nachweise:</span> {q.evidenceHint}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ReqChips ids={q.requirementIds} stacked />
                    </td>
                    {editable && (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon-sm" aria-label={`Frage ${i + 1} bearbeiten`} onClick={() => setSheet({ question: q })}>
                            <Pencil aria-hidden />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Frage ${i + 1} nach oben`} disabled={i === 0} onClick={() => notify(move(catalog.id, q.id, -1))}>
                            <ArrowUp aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Frage ${i + 1} nach unten`}
                            disabled={i === catalog.questions.length - 1}
                            onClick={() => notify(move(catalog.id, q.id, 1))}
                          >
                            <ArrowDown aria-hidden />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Frage ${i + 1} entfernen`} onClick={() => setRemoving(q)}>
                            <Trash2 aria-hidden />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      <QuestionSheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)} catalog={catalog} question={sheet?.question} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Frage entfernen"
        description="Die Frage wird aus dem Entwurf entfernt. Bestehende Checklisten behalten sie, die freigegebene Vorgängerversion bleibt unverändert."
        confirmLabel="Frage entfernen"
        onConfirm={() => removing && notify(remove(catalog.id, removing.id), "Frage entfernt")}
      />
    </div>
  );
}
