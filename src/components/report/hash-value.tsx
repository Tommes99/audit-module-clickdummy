"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Hash gekürzt (erste 8 Zeichen), vollständig im Tooltip */
export function HashValue({ hash }: { hash?: string }) {
  if (!hash) return <span className="text-muted-foreground">Noch nicht gesetzt</span>;
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="font-mono text-xs" />}>{hash.slice(0, 8)}</TooltipTrigger>
      <TooltipContent className="max-w-sm break-all font-mono">
        {hash}
        <span className="mt-1 block font-sans">Demo-Hash, nicht kryptografisch.</span>
      </TooltipContent>
    </Tooltip>
  );
}
