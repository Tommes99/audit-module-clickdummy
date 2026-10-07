"use client";

import { Search } from "lucide-react";
import {
  NativeSelect,
  type SelectOption,
} from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  findingClassificationLabels,
  findingStatusLabels,
} from "@/domain/labels";
import {
  EMPTY_FINDING_FILTERS,
  type FindingFilterState,
} from "@/components/findings-list/findings-filter";
import type { FindingClassification, FindingStatus } from "@/types/domain";

interface Props {
  filters: FindingFilterState;
  onChange: (patch: Partial<FindingFilterState>) => void;
  sites: SelectOption[];
  shown: number;
  total: number;
}

/** Filterleiste in einer Zeile: Suche, Status, Klassifizierung, Standort, Trefferzahl */
export function FindingsFilterBar({
  filters,
  onChange,
  sites,
  shown,
  total,
}: Props) {
  const active = Object.values(filters).some(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="relative w-full sm:w-60">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Nach Nummer oder Titel suchen"
          placeholder="Nummer oder Titel suchen"
          className="h-9 bg-card pl-8 dark:bg-card"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <NativeSelect
        aria-label="Status"
        className="w-44"
        value={filters.status}
        onChange={(v) => onChange({ status: v })}
        placeholder="Alle Status"
        options={(Object.keys(findingStatusLabels) as FindingStatus[]).map(
          (s) => ({ value: s, label: findingStatusLabels[s].label }),
        )}
      />
      <NativeSelect
        aria-label="Klassifizierung"
        className="w-52"
        value={filters.classification}
        onChange={(v) => onChange({ classification: v })}
        placeholder="Alle Klassifizierungen"
        options={(
          Object.keys(findingClassificationLabels) as FindingClassification[]
        ).map((c) => ({
          value: c,
          label: findingClassificationLabels[c].label,
        }))}
      />
      <NativeSelect
        aria-label="Standort"
        className="w-40"
        value={filters.site}
        onChange={(v) => onChange({ site: v })}
        placeholder="Alle Standorte"
        options={sites}
      />
      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FINDING_FILTERS)}
        >
          Zurücksetzen
        </Button>
      )}
      <p
        className="tnum ml-auto text-xs text-muted-foreground"
        aria-live="polite"
      >
        {shown} von {total} Feststellungen
      </p>
    </div>
  );
}
