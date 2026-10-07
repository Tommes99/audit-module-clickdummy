"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import type { ID } from "@/types/domain";

interface RequirementPickerProps {
  standardIds: ID[];
  value: ID[];
  onChange: (ids: ID[]) => void;
}

/** Auswahl der Anforderungen (Kapitel und Kurztitel) aus den Normen des Katalogs, mit Suche */
export function RequirementPicker({ standardIds, value, onChange }: RequirementPickerProps) {
  const data = useAppStore((s) => s.data);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.standards
      .filter((s) => standardIds.includes(s.id))
      .map((std) => ({
        std,
        items: data.requirements
          .filter((r) => r.standardId === std.id)
          .filter((r) => !q || `${r.clause} ${r.title}`.toLowerCase().includes(q)),
      }));
  }, [data.standards, data.requirements, standardIds, query]);

  const toggle = (id: ID, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <div className="space-y-2">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Kapitel oder Titel suchen"
        aria-label="Anforderungen suchen"
      />
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-2">
        {groups.map(({ std, items }) => (
          <fieldset key={std.id}>
            <legend className="px-1 pb-1 text-xs font-medium text-muted-foreground">{std.code}</legend>
            {items.length === 0 && <p className="px-1 text-xs text-muted-foreground">Keine Treffer.</p>}
            {items.map((r) => (
              <label key={r.id} className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm hover:bg-muted">
                <Checkbox checked={value.includes(r.id)} onCheckedChange={(on) => toggle(r.id, Boolean(on))} />
                <span className="tnum shrink-0 font-medium">{r.clause}</span>
                <span className="min-w-0 truncate text-muted-foreground">{r.title}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <p className="tnum text-xs text-muted-foreground">{value.length} {value.length === 1 ? "Anforderung" : "Anforderungen"} gewählt</p>
    </div>
  );
}
