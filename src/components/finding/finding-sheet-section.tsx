import type { ReactNode } from "react";
import { HelpHint } from "@/components/shared/help-hint";
import { Label } from "@/components/ui/label";
import type { HelpTopic } from "@/domain/help";

/** Nummerierter Abschnitt des Feststellungs-Sheets */
export function SheetSection({ step, title, help, children }: { step: number; title: string; help?: HelpTopic; children: ReactNode }) {
  return (
    <section aria-labelledby={`fs-sec-${step}`} className="space-y-4">
      <h3 id={`fs-sec-${step}`} className="flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold">
        <span className="tnum inline-flex size-5 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground" aria-hidden>
          {step}
        </span>
        {title}
        {help && <HelpHint topic={help} />}
      </h3>
      {children}
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: ReactNode;
  children: ReactNode;
}

/** Feld mit Beschriftung, Pflichtmarkierung und Fehlertext direkt darunter */
export function SheetField({ id, label, required, error, help, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <>
            <span className="text-danger" aria-hidden>
              *
            </span>
            <span className="sr-only">Pflichtfeld</span>
          </>
        )}
        {help}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
