"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { roleLabels, roleStartHints } from "@/domain/labels";
import { demoPersonas } from "@/domain/permissions";
import { useAppStore } from "@/store/app-store";

const initials = (name: string) =>
  name
    .replace(/^(Dr|Prof)\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info-soft text-xs font-semibold text-info-ink"
    >
      {initials(name)}
    </span>
  );
}

/** Rollenwechsler mit fünf Personas (ohne Login) und Benutzermenü mit "Demo zurücksetzen" */
export function RoleSwitcher() {
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const persons = useAppStore((s) => s.data.persons);
  const setSession = useAppStore((s) => s.setSession);
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  const [confirmReset, setConfirmReset] = useState(false);
  const name = (id: string) => persons.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="h-11 gap-2.5 px-2.5" aria-label="Rolle wechseln" />}
          >
            <Avatar name={name(session.personId)} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium">{name(session.personId)}</span>
              <span className="block text-xs font-normal text-muted-foreground">{roleLabels[session.role]}</span>
            </span>
            <ChevronDown className="text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Rolle wechseln</DropdownMenuLabel>
              {demoPersonas.map((p) => {
                const current = p.personId === session.personId;
                return (
                  <DropdownMenuItem
                    key={p.personId}
                    className="items-start gap-2.5 py-2"
                    onClick={() => {
                      setSession(p.personId, p.role);
                      router.push("/");
                    }}
                  >
                    <Avatar name={name(p.personId)} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{name(p.personId)}</span>
                      <span className="text-xs text-muted-foreground">{roleLabels[p.role]}</span>
                      <span className="mt-0.5 text-xs text-muted-foreground/80">{roleStartHints[p.role]}</span>
                    </span>
                    {current && <Check className="mt-1 size-4 text-primary" aria-label="Aktuelle Rolle" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden /> Demo zurücksetzen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demo zurücksetzen</DialogTitle>
            <DialogDescription>
              Alle Änderungen und der erweiterte Verlauf gehen verloren. Der Datenbestand kehrt zum Ausgangszustand zurück, die Rolle wechselt zu Sandra Keller.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                resetToSeed();
                setConfirmReset(false);
                router.push("/");
                toast.success("Demo zurückgesetzt");
              }}
            >
              Demo zurücksetzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
