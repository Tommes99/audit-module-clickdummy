"use client";

import { useMemo, useState } from "react";
import { NativeSelect } from "@/components/shared/native-select";
import { AddedGroup, ChangedGroup, RemovedGroup } from "@/components/catalogs/diff-groups";
import { diffQuestions } from "@/components/catalogs/diff";
import type { QuestionCatalog } from "@/types/domain";

/** Vergleich zweier Versionen desselben Katalogs: Standard ist die Vorgängerversion gegen die angezeigte Version */
export function VersionCompare({ catalog, versions }: { catalog: QuestionCatalog; versions: QuestionCatalog[] }) {
  const ascending = useMemo(() => [...versions].sort((a, b) => a.version - b.version), [versions]);
  const prev = ascending.filter((v) => v.version < catalog.version).at(-1) ?? ascending[0];
  const [fromId, setFromId] = useState(prev.id === catalog.id ? (ascending[1]?.id ?? prev.id) : prev.id);
  const [toId, setToId] = useState(catalog.id);
  const from = ascending.find((v) => v.id === fromId) ?? prev;
  const to = ascending.find((v) => v.id === toId) ?? catalog;
  const [older, newer] = from.version <= to.version ? [from, to] : [to, from];
  const diff = useMemo(() => diffQuestions(older, newer), [older, newer]);
  const options = ascending.map((v) => ({ value: v.id, label: `Version ${v.version}` }));
  const same = older.id === newer.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          Vergleiche
          <NativeSelect className="w-32" value={fromId} onChange={setFromId} options={options} />
        </label>
        <label className="flex items-center gap-2 text-muted-foreground">
          mit
          <NativeSelect className="w-32" value={toId} onChange={setToId} options={options} />
        </label>
      </div>
      {same ? (
        <p className="text-sm text-muted-foreground">Wählen Sie zwei verschiedene Versionen, um Unterschiede zu sehen.</p>
      ) : (
        <>
          <p className="tnum text-sm">
            Version {older.version} gegen Version {newer.version}: {diff.added.length} hinzugefügt, {diff.changed.length} geändert,{" "}
            {diff.removed.length} entfernt, {diff.unchanged} unverändert
          </p>
          <div className="grid gap-4">
            <AddedGroup questions={diff.added} version={newer.version} />
            <ChangedGroup items={diff.changed} />
            <RemovedGroup questions={diff.removed} version={older.version} />
          </div>
        </>
      )}
    </div>
  );
}
