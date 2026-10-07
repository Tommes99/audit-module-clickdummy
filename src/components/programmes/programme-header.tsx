"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import { formatDate } from "@/domain/labels";

/** Kopf der Programmseite: Titel, Verantwortliche, Freigabe. Die Ziele sind einklappbar. */
export function ProgrammeHeader() {
  const data = useAppStore((s) => s.data);
  const programme = data.programmes[0];
  const owner = useMemo(() => personName(data, programme?.ownerId), [data, programme]);
  const approver = useMemo(() => personName(data, programme?.approvedById), [data, programme]);
  if (!programme) return <PageHeader title="Auditprogramm" subtitle="Es ist noch kein Auditprogramm angelegt." />;

  return (
    <PageHeader
      title={programme.title}
      help="programme.page"
      subtitle={
        <>
          Verantwortlich: {owner}
          {programme.approvedAt && (
            <>
              . Freigegeben durch die Geschäftsführung ({approver}) am{" "}
              <span className="tnum">{formatDate(programme.approvedAt)}</span>
            </>
          )}
        </>
      }
      meta={
        <details className="group w-full text-sm">
          <summary className="-ml-1 inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-md px-1 text-foreground/80 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
            Ziele des Programms
            <span className="tnum text-muted-foreground">({programme.objectives.length})</span>
          </summary>
          <ul className="mt-1 list-disc space-y-1 pl-9 text-foreground/90">
            {programme.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </details>
      }
    />
  );
}
