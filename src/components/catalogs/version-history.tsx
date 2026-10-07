import Link from "next/link";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { CatalogStatusBadge } from "@/components/shared/status-badge";
import { VersionCompare } from "@/components/catalogs/version-compare";
import { formatDate } from "@/domain/labels";
import type { QuestionCatalog } from "@/types/domain";

/** Versionsliste plus Vergleich (nur bei mehr als einer Version) */
export function VersionHistory({ catalog, versions }: { catalog: QuestionCatalog; versions: QuestionCatalog[] }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="cat-versions">
        <div id="cat-versions">
          <SectionTitle help="catalogs.versions" count={versions.length}>Versionen</SectionTitle>
        </div>
        <Panel padded={false}>
          <ul className="divide-y divide-border">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 text-sm">
                {v.id === catalog.id ? (
                  <span className="tnum font-semibold" aria-current="page">Version {v.version} (angezeigt)</span>
                ) : (
                  <Link href={`/kataloge/${v.id}`} className="tnum font-medium text-primary hover:underline">
                    Version {v.version}
                  </Link>
                )}
                <CatalogStatusBadge status={v.status} />
                <span className="tnum text-xs text-muted-foreground">{v.questions.length} Fragen</span>
                {v.releasedAt && <span className="tnum text-xs text-muted-foreground">freigegeben am {formatDate(v.releasedAt)}</span>}
              </li>
            ))}
          </ul>
        </Panel>
      </section>
      {versions.length > 1 && (
        <section aria-labelledby="cat-compare">
          <div id="cat-compare">
            <SectionTitle>Versionen vergleichen</SectionTitle>
          </div>
          <VersionCompare key={catalog.id} catalog={catalog} versions={versions} />
        </section>
      )}
    </div>
  );
}
