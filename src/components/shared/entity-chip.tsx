"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { resolveEntity, type EntityKind } from "@/store/selectors";
import { cn } from "@/lib/utils";

interface EntityChipProps {
  kind: EntityKind;
  id: string;
  /** Kurztitel neben der Nummer zeigen (Standard: ja) */
  showTitle?: boolean;
  className?: string;
}

/**
 * Verknüpftes Objekt als Chip mit fachlicher Nummer und Kurztitel,
 * z. B. "R-012 Kollision Flurförderzeug", "ISO 45001 8.1.3". Klickbar, wenn es eine Zielseite gibt.
 */
export function EntityChip({ kind, id, showTitle = true, className }: EntityChipProps) {
  const data = useAppStore((s) => s.data);
  const entity = useMemo(() => resolveEntity(data, kind, id), [data, kind, id]);
  const body = (
    <>
      <span className="tnum shrink-0 whitespace-nowrap font-medium">{entity.label}</span>
      {showTitle && entity.title && <span className="truncate text-muted-foreground">{entity.title}</span>}
    </>
  );
  const base =
    "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-px text-xs leading-5 transition-colors";
  if (entity.href) {
    return (
      <Link href={entity.href} className={cn(base, "hover:border-primary/40 hover:bg-info-soft hover:text-info-ink", className)} title={entity.title}>
        {body}
      </Link>
    );
  }
  return (
    <span className={cn(base, className)} title={entity.title}>
      {body}
    </span>
  );
}

export function EntityChips({ kind, ids, showTitle }: { kind: EntityKind; ids: string[]; showTitle?: boolean }) {
  if (ids.length === 0) return <span className="text-sm text-muted-foreground">Keine</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <EntityChip key={id} kind={kind} id={id} showTitle={showTitle} />
      ))}
    </span>
  );
}
