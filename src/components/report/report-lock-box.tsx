import { Lock } from "lucide-react";
import { HashValue } from "@/components/report/hash-value";
import { HelpHint } from "@/components/shared/help-hint";
import type { AuditReport } from "@/types/domain";

/** Sperrhinweis für freigegebene und ersetzte Berichte, mit sichtbarem Inhaltshash */
export function ReportLockBox({ report }: { report: AuditReport }) {
  const superseded = report.status === "superseded";
  return (
    <div role="note" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
      <div className="flex min-w-0 items-start gap-2.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">{superseded ? "Version ersetzt, nur lesbar" : "Bericht gesperrt"}</p>
          <p className="text-muted-foreground">
            {superseded
              ? "Diese Version bleibt unverändert sichtbar. Die aktuelle Version steht in der Versionstabelle."
              : "Änderungen sind nur über „Neue Version anlegen“ mit Begründung möglich."}
          </p>
        </div>
      </div>
      <p className="flex items-center gap-2">
        <span className="text-muted-foreground">Inhaltshash</span>
        <HashValue hash={report.contentHash} />
        <HelpHint topic="audit.reportHash" side="left" />
      </p>
    </div>
  );
}
