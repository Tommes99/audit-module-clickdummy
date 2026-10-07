import type { ReactNode } from "react";
import Link from "next/link";
import { EntityChip } from "@/components/shared/entity-chip";
import { DueText } from "@/components/shared/due-text";
import { ActionStatusBadge } from "@/components/shared/status-badge";
import { actionKindLabels, actionKindShortLabels, actionStatusLabels } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { ActionRow } from "@/store/selectors";

export type SortKey = "number" | "kind" | "title" | "finding" | "site" | "owner" | "due" | "status";

export interface Names {
  person: (id: string) => string;
  site: (id: string | null) => string;
}

export interface ActionColumn {
  key: SortKey;
  header: string;
  /** Text für die Sortierung */
  sortValue: (r: ActionRow, names: Names) => string;
  cell: (r: ActionRow, names: Names) => ReactNode;
}

export const isOpen = (r: ActionRow) => r.action.status === "open" || r.action.status === "in_progress";

/** Offene vor erledigten, innerhalb nach Frist aufsteigend */
export const byDue = (a: ActionRow, b: ActionRow) =>
  Number(!isOpen(a)) - Number(!isOpen(b)) || a.action.dueDate.localeCompare(b.action.dueDate);

export const actionColumns: ActionColumn[] = [
  {
    key: "number",
    header: "Nummer",
    sortValue: (r) => r.action.number,
    cell: (r) => (
      <Link href={`/feststellungen/${r.action.source.id}#massnahmen`} className="tnum font-medium text-primary hover:underline">
        {r.action.number}
      </Link>
    ),
  },
  {
    key: "kind",
    header: "Art",
    sortValue: (r) => actionKindShortLabels[r.action.kind],
    // Korrektur (Symptom) und Korrekturmaßnahme (Ursache) sind fachlich verschieden und bleiben optisch getrennt
    cell: (r) => (
      <span
        title={actionKindLabels[r.action.kind]}
        className={cn(
          "inline-flex h-5 items-center rounded-md border px-1.5 text-xs font-medium",
          r.action.kind === "corrective_action" ? "border-primary/30 bg-info-soft text-info-ink" : "border-border bg-card text-foreground",
        )}
      >
        {actionKindShortLabels[r.action.kind]}
      </span>
    ),
  },
  { key: "title", header: "Titel", sortValue: (r) => r.action.title, cell: (r) => <span className="block min-w-48 max-w-72 whitespace-normal">{r.action.title}</span> },
  {
    key: "finding",
    header: "Feststellung",
    sortValue: (r) => r.finding?.number ?? "",
    cell: (r) => (r.finding ? <EntityChip kind="finding" id={r.finding.id} showTitle={false} className="whitespace-nowrap" /> : <span className="text-muted-foreground">Keine</span>),
  },
  { key: "site", header: "Standort", sortValue: (r, n) => n.site(r.siteId), cell: (r, n) => <span className="whitespace-normal">{n.site(r.siteId)}</span> },
  { key: "owner", header: "Verantwortliche:r", sortValue: (r, n) => n.person(r.action.ownerId), cell: (r, n) => <span className="whitespace-normal">{n.person(r.action.ownerId)}</span> },
  { key: "due", header: "Frist", sortValue: (r) => r.action.dueDate, cell: (r) => <DueText dueDate={r.action.dueDate} done={!isOpen(r)} /> },
  {
    key: "status",
    header: "Status",
    sortValue: (r) => actionStatusLabels[r.action.status].label,
    cell: (r) => <ActionStatusBadge status={r.action.status} />,
  },
];

export function compareRows(key: SortKey, dir: "asc" | "desc", names: Names) {
  const col = actionColumns.find((c) => c.key === key)!;
  const sign = dir === "asc" ? 1 : -1;
  return (a: ActionRow, b: ActionRow) =>
    sign * (key === "due" ? byDue(a, b) : col.sortValue(a, names).localeCompare(col.sortValue(b, names), "de", { numeric: true })) ||
    byDue(a, b);
}
