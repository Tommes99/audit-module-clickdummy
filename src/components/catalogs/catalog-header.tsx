"use client";

import { useRouter } from "next/navigation";
import { PageHeader, FactList } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { EntityChips } from "@/components/shared/entity-chip";
import { NativeSelect } from "@/components/shared/native-select";
import { CatalogStatusBadge } from "@/components/shared/status-badge";
import { CatalogActions } from "@/components/catalogs/catalog-actions";
import { DraftBanner } from "@/components/catalogs/draft-banner";
import { useAppStore } from "@/store/app-store";
import { personName } from "@/store/selectors";
import { formatDate } from "@/domain/labels";
import type { QuestionCatalog } from "@/types/domain";

/** Kopf der Katalogdetailseite: Brotkrumen, Name, Version mit Auswahl, Status, Normen, Freigabe und Änderungshinweis */
export function CatalogHeader({ catalog, versions }: { catalog: QuestionCatalog; versions: QuestionCatalog[] }) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const facts = [
    {
      label: "Freigegeben",
      value: catalog.releasedAt ? (
        <span className="tnum">
          {formatDate(catalog.releasedAt)} durch {personName(data, catalog.releasedById)}
        </span>
      ) : (
        "Noch nicht freigegeben"
      ),
    },
    ...(catalog.changeNote ? [{ label: "Änderungshinweis", value: catalog.changeNote }] : []),
  ];
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Fragenkataloge", href: "/kataloge" }, { label: catalog.name }]}
        title={catalog.name}
        meta={
          <>
            <span className="tnum font-medium text-foreground">Version {catalog.version}</span>
            <CatalogStatusBadge status={catalog.status} />
            <EntityChips kind="standard" ids={catalog.standardIds} showTitle={false} />
            <span className="tnum">{catalog.questions.length} Fragen</span>
          </>
        }
        actions={
          <>
            {versions.length > 1 && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Version anzeigen
                <NativeSelect
                  className="w-36"
                  value={catalog.id}
                  onChange={(id) => router.push(`/kataloge/${id}`)}
                  options={versions.map((v) => ({ value: v.id, label: `Version ${v.version}` }))}
                />
              </label>
            )}
            <CatalogActions catalog={catalog} />
          </>
        }
      />
      {catalog.status === "draft" && <DraftBanner catalog={catalog} versions={versions} />}
      {catalog.status !== "draft" && (
        <Panel className="-mt-2">
          <FactList items={facts} />
        </Panel>
      )}
    </>
  );
}
