"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { eventActionLabels } from "@/domain/labels";
import { emptyTrailFilter, type TrailFilter } from "@/components/trail/trail-filter";
import type { AuditEvent, EventAction } from "@/types/domain";

interface TrailFiltersProps {
  events: AuditEvent[];
  filter: TrailFilter;
  onChange: (patch: Partial<TrailFilter>) => void;
  shown: number;
  total: number;
}

/** Kompakte Filterzeile: Audit, Person, Aktion, Suche, nur KI. Beschriftung per aria-label, Platzhalter nennen das Feld. */
export function TrailFilters({ events, filter, onChange, shown, total }: TrailFiltersProps) {
  const data = useAppStore((s) => s.data);

  const auditOptions = useMemo(
    () => [...data.audits].sort((a, b) => a.number.localeCompare(b.number)).map((a) => ({ value: a.id, label: `${a.number} ${a.title}` })),
    [data.audits],
  );
  const actorOptions = useMemo(() => {
    const ids = [...new Set(events.map((e) => e.actorId))];
    return ids
      .map((id) => ({ value: id, label: data.persons.find((p) => p.id === id)?.name ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label, "de"));
  }, [events, data.persons]);
  const actionOptions = useMemo(
    () => [...new Set(events.map((e) => e.action))].map((a) => ({ value: a, label: eventActionLabels[a] })).sort((a, b) => a.label.localeCompare(b.label, "de")),
    [events],
  );
  const isFiltered = JSON.stringify(filter) !== JSON.stringify(emptyTrailFilter);

  return (
    <section aria-label="Filter" className="mb-3 flex flex-wrap items-center gap-2">
      <NativeSelect aria-label="Audit" className="w-auto max-w-56 flex-1 sm:flex-none" value={filter.auditId} onChange={(v) => onChange({ auditId: v })} options={auditOptions} placeholder="Alle Audits" />
      <NativeSelect aria-label="Person" className="w-auto max-w-44 flex-1 sm:flex-none" value={filter.actorId} onChange={(v) => onChange({ actorId: v })} options={actorOptions} placeholder="Alle Personen" />
      <NativeSelect
        aria-label="Aktion"
        className="w-auto max-w-48 flex-1 sm:flex-none"
        value={filter.action}
        onChange={(v) => onChange({ action: v as EventAction | "" })}
        options={actionOptions}
        placeholder="Alle Aktionen"
      />
      <Input
        aria-label="Suche in der Zusammenfassung"
        className="h-9 min-w-44 flex-1 sm:max-w-64"
        value={filter.query}
        onChange={(e) => onChange({ query: e.target.value })}
        placeholder="Suchen, z. B. F-2026-007"
      />
      <div className="flex min-h-9 items-center gap-2 px-1">
        <Checkbox id="trail-ai" checked={filter.aiOnly} onCheckedChange={(c) => onChange({ aiOnly: c === true })} />
        <Label htmlFor="trail-ai" className="text-sm">Nur KI-Einträge</Label>
      </div>
      {isFiltered && (
        <button type="button" className="min-h-9 px-1 text-sm text-primary hover:underline" onClick={() => onChange(emptyTrailFilter)}>
          Zurücksetzen
        </button>
      )}
      <p className="tnum ml-auto text-sm text-muted-foreground" aria-live="polite">
        {shown === total ? `${total} Einträge` : `${shown} von ${total} Einträgen`}
      </p>
    </section>
  );
}
