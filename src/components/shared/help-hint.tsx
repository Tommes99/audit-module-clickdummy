"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { helpTopics, type HelpTopic, type HelpTopicDef } from "@/domain/help";
import { cn } from "@/lib/utils";

interface HelpHintProps {
  topic: HelpTopic;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Kleines "?" mit erklärendem Text. Öffnet per Hover, Klick, Tippen oder Tastatur (tablet-tauglich).
 * Die Texte stehen zentral in domain/help.ts, damit die Seiten ruhig bleiben.
 */
export function HelpHint({ topic, className, side = "bottom" }: HelpHintProps) {
  const def: HelpTopicDef = helpTopics[topic];
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={250}
        closeDelay={120}
        aria-label={`Hilfe: ${def.title}`}
        className={cn(
          "inline-flex size-[18px] shrink-0 cursor-help items-center justify-center rounded-full border border-input bg-card text-[11px] font-semibold leading-none text-muted-foreground transition-colors hover:border-primary hover:text-primary aria-expanded:border-primary aria-expanded:bg-info-soft aria-expanded:text-primary",
          className,
        )}
      >
        ?
      </PopoverTrigger>
      <PopoverContent side={side} align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-1.5 p-3.5">
        <p className="text-sm font-semibold leading-snug">{def.title}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{def.body}</p>
        {def.points && (
          <ul className="list-disc space-y-0.5 pl-4 text-[13px] leading-relaxed text-muted-foreground marker:text-border">
            {def.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
