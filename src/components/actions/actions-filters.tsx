"use client";

import { NativeSelect, type SelectOption } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { actionStatusLabels } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { ActionStatus } from "@/types/domain";

export const DUE_OPTIONS: SelectOption[] = [
  { value: "open", label: "Alle offenen" },
  { value: "overdue", label: "Überfällig" },
  { value: "due_soon", label: "Bald fällig (14 Tage)" },
  { value: "on_track", label: "In Ordnung" },
];
export const NO_SITE = "none";

export interface ActionFilterState {
  status: string;
  due: string;
  person: string;
  site: string;
}

export const EMPTY_FILTERS: ActionFilterState = { status: "", due: "", person: "", site: "" };

interface QuickCount {
  value: string;
  label: string;
  count: number;
}

/** Schnellfilter als Chips mit Zahlen, setzt den Filter "Fälligkeit" */
export function QuickChips({ items, active, onPick }: { items: QuickCount[]; active: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Schnellfilter">
      {items.map((i) => {
        const on = active === i.value;
        return (
          <button
            key={i.value || "all"}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(on ? "" : i.value)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              on ? "border-primary bg-info-soft font-medium text-info-ink" : "border-border bg-card hover:border-primary/40 hover:bg-muted/60",
            )}
          >
            {i.label}
            <span className={cn("tnum text-xs font-semibold", i.value === "overdue" && i.count > 0 && !on ? "text-danger-ink" : "text-muted-foreground")}>
              {i.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface FilterBarProps {
  filters: ActionFilterState;
  onChange: (patch: Partial<ActionFilterState>) => void;
  owners: SelectOption[];
  sites: SelectOption[];
  shown: number;
  total: number;
}

/** Filterleiste in einer Zeile: Status, Fälligkeit, Person, Standort, Trefferzahl */
export function ActionsFilterBar({ filters, onChange, owners, sites, shown, total }: FilterBarProps) {
  const active = Boolean(filters.status || filters.due || filters.person || filters.site);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <NativeSelect
        aria-label="Status"
        className="w-40"
        value={filters.status}
        onChange={(v) => onChange({ status: v })}
        placeholder="Alle Status"
        options={(Object.keys(actionStatusLabels) as ActionStatus[]).map((s) => ({ value: s, label: actionStatusLabels[s].label }))}
      />
      <NativeSelect aria-label="Fälligkeit" className="w-44" value={filters.due} onChange={(v) => onChange({ due: v })} placeholder="Alle Fälligkeiten" options={DUE_OPTIONS} />
      <NativeSelect aria-label="Person" className="w-44" value={filters.person} onChange={(v) => onChange({ person: v })} placeholder="Alle Personen" options={owners} />
      <NativeSelect aria-label="Standort" className="w-40" value={filters.site} onChange={(v) => onChange({ site: v })} placeholder="Alle Standorte" options={sites} />
      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          Zurücksetzen
        </Button>
      )}
      <p className="tnum ml-auto text-xs text-muted-foreground" aria-live="polite">
        {shown} von {total} Maßnahmen
      </p>
    </div>
  );
}
