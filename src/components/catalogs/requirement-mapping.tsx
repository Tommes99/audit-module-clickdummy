"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { ReqChip } from "@/components/catalogs/req-chip";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { equivalentRequirements } from "@/domain/rules";
import { resolveEntity } from "@/store/selectors";
import type { QuestionCatalog, Requirement, SeedData } from "@/types/domain";

const BASES = ["Harmonized Structure", "Kuratiertes Paar"] as const;

/** Herkunft der Zuordnung nennen: gemeinsamer Strukturschlüssel oder kuratiertes Paar, nie die Kapitelnummer */
function mappingBasis(source: Requirement, other: Requirement): (typeof BASES)[number] {
  return source.harmonizedKey && source.harmonizedKey === other.harmonizedKey ? "Harmonized Structure" : "Kuratiertes Paar";
}

function catalogRequirements(catalog: QuestionCatalog, data: SeedData): Requirement[] {
  const ids = new Set(catalog.questions.flatMap((q) => q.requirementIds));
  return data.requirements.filter((r) => ids.has(r.id)).sort((a, b) => a.clause.localeCompare(b.clause, "de", { numeric: true }));
}

function Row({ req, data }: { req: Requirement; data: SeedData }) {
  const equivalents = equivalentRequirements(req.id, data.requirements);
  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="w-[40%] px-3 py-2.5">
        <ReqChip id={req.id} />
      </td>
      <td className="px-3 py-2.5">
        {equivalents.length === 0 ? (
          <span className="text-xs text-muted-foreground">Normspezifisch, keine gleichwertige Anforderung hinterlegt</span>
        ) : (
          <div className="space-y-1.5">
            {BASES.map((basis) => {
              const items = equivalents.filter((e) => mappingBasis(req, e) === basis);
              return items.length === 0 ? null : (
                <div key={basis} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">{basis}</span>
                  {items.map((e) => (
                    <ReqChip key={e.id} id={e.id} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </td>
    </tr>
  );
}

/** Anforderungen des Katalogs, gruppiert nach Norm, mit gleichwertigen Anforderungen anderer Normen */
export function RequirementMapping({ catalog }: { catalog: QuestionCatalog }) {
  const data = useAppStore((s) => s.data);
  // ?q= aus der Schnellsuche füllt das Suchfeld vor
  const initialQuery = useSearchParams().get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const reqs = useMemo(() => catalogRequirements(catalog, data), [catalog, data]);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (r: Requirement) => {
      const e = resolveEntity(data, "requirement", r.id);
      return !q || `${e.label} ${e.title ?? ""}`.toLowerCase().includes(q);
    };
    return data.standards
      .map((s) => ({ standard: s, items: reqs.filter((r) => r.standardId === s.id && matches(r)) }))
      .filter((g) => g.items.length > 0);
  }, [reqs, data, query]);

  return (
    <section aria-labelledby="cat-mapping" className="space-y-4">
      <div id="cat-mapping">
        <SectionTitle help="catalogs.mapping" count={reqs.length}>Anforderungen und gleichwertige Anforderungen</SectionTitle>
      </div>
      <Input
        aria-label="Anforderung suchen"
        className="h-9 max-w-xs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Anforderung suchen, z. B. 10.2"
      />
      {groups.length === 0 && <p className="text-sm text-muted-foreground">Keine Anforderung gefunden. Passen Sie die Suche an.</p>}
      {groups.map(({ standard, items }) => (
        <Panel key={standard.id} padded={false}>
          <h3 className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold">
            {standard.code}
            <span className="tnum font-normal text-muted-foreground">{items.length} Anforderungen</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] table-fixed text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Anforderung im Katalog</th>
                  <th scope="col">Gleichwertig in anderen Normen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <Row key={r.id} req={r} data={data} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </section>
  );
}
