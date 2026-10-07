"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { roleLabels } from "@/domain/labels";
import { demoPersonas } from "@/domain/permissions";
import { tourSteps } from "@/domain/tour";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const KEY = "audit-clickdummy-tour";

const readDone = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

/** Demo-Rundgang: die Schritte des Drehbuchs als Checkliste. Ein Klick wechselt die Rolle und öffnet die Seite. */
export function TourSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const persons = useAppStore((s) => s.data.persons);
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  // Läuft nur im Browser (die Shell rendert erst nach der Hydrierung)
  const [done, setDone] = useState<string[]>(readDone);

  const mark = (id: string, value: boolean) => {
    const next = value ? [...new Set([...done, id])] : done.filter((d) => d !== id);
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Speicher nicht verfügbar: Fortschritt gilt nur für diese Sitzung
    }
  };

  const openStep = (id: string) => {
    const step = tourSteps.find((s) => s.id === id);
    if (!step) return;
    const persona = demoPersonas.find((p) => p.personId === step.personId);
    if (persona && persona.personId !== session.personId) setSession(persona.personId, persona.role);
    mark(id, true);
    onOpenChange(false);
    router.push(step.href);
  };

  const nextId = tourSteps.find((s) => !done.includes(s.id))?.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Route className="size-4 text-primary" aria-hidden /> Demo-Rundgang
          </SheetTitle>
          <SheetDescription>
            {done.length} von {tourSteps.length} Schritten besucht. Ein Klick wechselt zur passenden Rolle und öffnet die Seite.
          </SheetDescription>
        </SheetHeader>
        <ol className="flex-1 space-y-1 overflow-y-auto p-3">
          {tourSteps.map((step, i) => {
            const isDone = done.includes(step.id);
            const person = persons.find((p) => p.id === step.personId);
            const persona = demoPersonas.find((p) => p.personId === step.personId);
            return (
              <li key={step.id} className={cn("flex gap-3 rounded-lg p-2.5", step.id === nextId && "bg-info-soft")}>
                <button
                  type="button"
                  onClick={() => mark(step.id, !isDone)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `Schritt ${i + 1} als offen markieren` : `Schritt ${i + 1} als besucht markieren`}
                  className={cn(
                    "tnum mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    isDone ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground hover:border-primary",
                  )}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{step.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {person?.name}
                    {persona ? `, ${roleLabels[persona.role]}` : ""}
                  </p>
                </div>
                <Button size="sm" variant={step.id === nextId ? "default" : "outline"} onClick={() => openStep(step.id)} className="self-start">
                  Öffnen
                </Button>
              </li>
            );
          })}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
