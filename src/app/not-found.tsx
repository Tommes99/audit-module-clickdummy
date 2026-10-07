import Link from "next/link";
import { EmptyState } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

/** Unbekannte Route: deutscher Leerzustand mit Weg zurück */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Seite nicht gefunden</h1>
      <EmptyState
        action={
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Zu Meine Aufgaben
          </Link>
        }
      >
        Diese Seite gibt es im Clickdummy nicht. Nutzen Sie die Navigation oder die Schnellsuche (Strg K).
      </EmptyState>
    </div>
  );
}
