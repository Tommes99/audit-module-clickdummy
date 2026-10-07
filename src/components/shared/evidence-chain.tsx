"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { evidenceChain, type ChainNode } from "@/store/selectors";
import { HelpHint } from "@/components/shared/help-hint";
import type { Finding } from "@/types/domain";
import { cn } from "@/lib/utils";

/** Glieder ohne eigene Zielseite springen zum passenden Abschnitt der Feststellungsseite */
const anchorFallback: Record<string, string> = { requirement: "#verknuepfungen", finding: "#details" };

function NodeBody({ node, index, current }: { node: ChainNode; index: number; current: boolean }) {
  return (
    <>
      <span
        className={cn(
          "relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold tnum transition-shadow",
          node.done
            ? "border-primary bg-primary text-primary-foreground"
            : node.na
              ? "border-dashed border-input bg-card text-muted-foreground"
              : "border-primary/50 bg-card text-primary",
          current && "ring-4 ring-primary/15",
        )}
        aria-hidden
      >
        {node.done ? <Check className="size-4.5" strokeWidth={3} /> : index + 1}
      </span>
      <span className="mt-2 text-[13px] font-semibold leading-tight">{node.label}</span>
      <span className="mt-0.5 max-w-[9.5rem] text-xs leading-snug text-muted-foreground">{node.detail}</span>
      <span className="sr-only">{node.done ? ", erledigt" : node.na ? ", nicht zutreffend" : ", offen"}</span>
    </>
  );
}

/**
 * Nachweiskette: Anforderung → Checklistenpunkt → Nachweis → Feststellung → Maßnahmen → Wirksamkeitsprüfung.
 * Erledigte Glieder sind gefüllt, offene als Umriss, das nächste offene Glied trägt einen Ring.
 * Jedes Glied ist klickbar (Seite oder Abschnitt). Auf schmalen Breiten scrollt die Spur waagerecht.
 */
export function EvidenceChain({ finding }: { finding: Finding }) {
  const data = useAppStore((s) => s.data);
  const nodes = useMemo(() => evidenceChain(data, finding), [data, finding]);
  const currentIndex = nodes.findIndex((n) => !n.done && !n.na);
  return (
    <nav aria-label="Nachweiskette" className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 px-4 pt-3">
        <h2 className="text-sm font-semibold">Nachweiskette</h2>
        <HelpHint topic="finding.chain" />
      </div>
      <div className="overflow-x-auto px-4 pb-4 pt-3">
        <ol className="flex min-w-[42rem] items-start">
          {nodes.map((node, i) => {
            const item = "group flex flex-col items-center rounded-lg px-1 text-center outline-offset-4";
            const href = node.href ?? anchorFallback[node.key];
            const body = <NodeBody node={node} index={i} current={i === currentIndex} />;
            return (
              <li key={node.key} className="relative flex flex-1 justify-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn("absolute right-1/2 top-[17px] h-0.5 w-full", nodes[i - 1].done && node.done ? "bg-primary" : "bg-border")}
                  />
                )}
                {href?.startsWith("#") ? (
                  <a href={href} className={cn(item, "hover:text-primary")}>
                    {body}
                  </a>
                ) : href ? (
                  <Link href={href} className={cn(item, "hover:text-primary")}>
                    {body}
                  </Link>
                ) : (
                  <div className={item}>{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
