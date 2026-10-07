"use client";

import { useMemo } from "react";
import { Paperclip } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { personName, publishedEvidenceFor } from "@/store/selectors";
import type { ID } from "@/types/domain";

/** Vorhandene Nachweise bleiben auch bei eingeklapptem Punkt sichtbar: Titel und wer sie bereitgestellt hat */
export function ChecklistEvidenceLine({ evidenceIds }: { evidenceIds: ID[] }) {
  const data = useAppStore((s) => s.data);
  const items = useMemo(() => publishedEvidenceFor(data, evidenceIds), [data, evidenceIds]);
  if (items.length === 0) return null;
  const shown = items.slice(0, 2);
  return (
    <ul className="space-y-0.5 text-xs text-muted-foreground" aria-label="Vorhandene Nachweise">
      {shown.map((e) => (
        <li key={e.id} className="flex min-w-0 items-center gap-1.5">
          <Paperclip className="size-3 shrink-0" aria-hidden />
          <span className="truncate text-foreground/80">{e.title}</span>
          <span className="shrink-0">von {personName(data, e.uploadedById)}</span>
        </li>
      ))}
      {items.length > shown.length && <li className="pl-[18px]">und {items.length - shown.length} weitere</li>}
    </ul>
  );
}
