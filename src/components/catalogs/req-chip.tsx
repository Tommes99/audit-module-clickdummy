import { EntityChip } from "@/components/shared/entity-chip";

/** Anforderungs-Chip: Kapitel bleibt in einer Zeile, nur der Kurztitel wird gekürzt */
export function ReqChip({ id }: { id: string }) {
  return <EntityChip kind="requirement" id={id} className="[&>span:first-child]:shrink-0 [&>span:first-child]:whitespace-nowrap" />;
}

export function ReqChips({ ids, stacked = false }: { ids: string[]; stacked?: boolean }) {
  if (ids.length === 0) return <span className="text-sm text-muted-foreground">Keine</span>;
  return (
    <div className={stacked ? "flex flex-col items-start gap-1" : "flex flex-wrap gap-1"}>
      {ids.map((id) => (
        <ReqChip key={id} id={id} />
      ))}
    </div>
  );
}
