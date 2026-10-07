"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EntityChips } from "@/components/shared/entity-chip";
import { CatalogStatusBadge } from "@/components/shared/status-badge";
import { useAppStore } from "@/store/app-store";
import { auditsUsingCatalog } from "@/store/selectors";
import { formatDate } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { QuestionCatalog } from "@/types/domain";

/** Tabellenzeilen eines Katalogs: aktuelle Version, darunter bei Bedarf die älteren Versionen */
export function CatalogRows({ versions, expanded, onToggle }: { versions: QuestionCatalog[]; expanded: boolean; onToggle: () => void }) {
  const data = useAppStore((s) => s.data);
  // Ein Entwurf ist nie die aktuelle Version: er steht als Hinweis an der freigegebenen Version
  const draft = versions.find((v) => v.status === "draft");
  const [latest, ...older] = versions.filter((v) => v.status !== "draft");
  const usage = (c: QuestionCatalog) => auditsUsingCatalog(data, c.id).length;
  const totalUsage = versions.reduce((n, v) => n + usage(v), 0);
  const olderId = `older-${latest.key}`;

  return (
    <>
      <tr className="border-b border-border align-top last:border-0">
        <th scope="row" className="px-3 py-3 text-left font-normal">
          <Link href={`/kataloge/${latest.id}`} className="font-medium text-primary hover:underline">
            {latest.name}
          </Link>
          {draft && (
            <Link
              href={`/kataloge/${draft.id}`}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-info-soft px-2 py-0.5 text-xs font-medium text-info-ink hover:border-primary/50"
            >
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              Entwurf Version {draft.version} in Arbeit
            </Link>
          )}
          {older.length > 0 && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={olderId}
              className="mt-1 flex min-h-8 items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronRight aria-hidden className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
              {older.length === 1 ? "1 ältere Version" : `${older.length} ältere Versionen`}
            </button>
          )}
        </th>
        <td className="px-3 py-3">
          <span className="whitespace-nowrap"><EntityChips kind="standard" ids={latest.standardIds} showTitle={false} /></span>
        </td>
        <td className="px-3 py-3">
          <span className="flex flex-wrap items-center gap-2">
            <span className="tnum font-medium">Version {latest.version}</span>
            <CatalogStatusBadge status={latest.status} />
          </span>
        </td>
        <td className="tnum px-3 py-3 text-right">{latest.questions.length}</td>
        <td className="tnum px-3 py-3 text-right">
          {totalUsage === 0 ? <span className="text-muted-foreground/60">0</span> : totalUsage === 1 ? "1 Audit" : `${totalUsage} Audits`}
        </td>
        <td className="tnum whitespace-nowrap px-3 py-3 text-muted-foreground">{latest.releasedAt ? formatDate(latest.releasedAt) : "Noch nicht freigegeben"}</td>
      </tr>
      {expanded &&
        older.map((v, i) => (
          <tr key={v.id} id={i === 0 ? olderId : undefined} className="border-b border-border bg-muted/30 align-top last:border-0">
            <th scope="row" className="py-2 pl-8 pr-3 text-left text-[13px] font-normal text-muted-foreground">Ältere Version</th>
            <td className="px-3 py-2" />
            <td className="px-3 py-2">
              <span className="flex flex-wrap items-center gap-2">
                <Link href={`/kataloge/${v.id}`} className="tnum font-medium text-primary hover:underline">
                  Version {v.version}
                </Link>
                <CatalogStatusBadge status={v.status} />
              </span>
            </td>
            <td className="tnum px-3 py-2 text-right">{v.questions.length}</td>
            <td className="tnum px-3 py-2 text-right">{usage(v) === 0 ? <span className="text-muted-foreground/60">0</span> : usage(v) === 1 ? "1 Audit" : `${usage(v)} Audits`}</td>
            <td className="tnum whitespace-nowrap px-3 py-2 text-muted-foreground">{v.releasedAt ? formatDate(v.releasedAt) : "Noch nicht freigegeben"}</td>
          </tr>
        ))}
    </>
  );
}
