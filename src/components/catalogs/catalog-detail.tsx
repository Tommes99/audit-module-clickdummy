"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Breadcrumbs, EmptyState } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { auditsUsingCatalog, catalogVersions } from "@/store/selectors";
import { CatalogHeader } from "@/components/catalogs/catalog-header";
import { QuestionTable } from "@/components/catalogs/question-table";
import { RequirementMapping } from "@/components/catalogs/requirement-mapping";
import { VersionHistory } from "@/components/catalogs/version-history";
import { CatalogUsage } from "@/components/catalogs/catalog-usage";

const tabs = ["fragen", "mapping", "versionen", "verwendung"];

const count = (n: number) => <span className="tnum text-xs font-normal text-muted-foreground">{n}</span>;

export function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  // ?tab=mapping öffnet direkt einen Tab, z. B. aus dem Demo-Rundgang
  const tabParam = useSearchParams().get("tab");
  const initialTab = tabs.includes(tabParam ?? "") ? (tabParam as string) : "fragen";
  const data = useAppStore((s) => s.data);
  const catalog = useMemo(() => data.catalogs.find((c) => c.id === id), [data.catalogs, id]);
  const versions = useMemo(() => (catalog ? catalogVersions(data, catalog) : []), [data, catalog]);

  if (!catalog) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Fragenkataloge", href: "/kataloge" }, { label: "Katalog nicht gefunden" }]} />
        <EmptyState>Fragenkatalog nicht gefunden. Wählen Sie einen Katalog in der Übersicht der Fragenkataloge.</EmptyState>
      </>
    );
  }
  const usage = auditsUsingCatalog(data, catalog.id).length;
  const trigger = "min-h-9 px-3";
  return (
    <div>
      <CatalogHeader catalog={catalog} versions={versions} />
      {/* key: beim Versionswechsel beginnt die Ansicht wieder bei den Fragen */}
      <Tabs key={catalog.id} defaultValue={initialTab} className="mt-6 gap-5">
        {/* Auf schmalen Bildschirmen umbrechen statt abschneiden */}
        <TabsList variant="line" className="flex-wrap gap-y-0 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="fragen" className={trigger}>Fragen {count(catalog.questions.length)}</TabsTrigger>
          <TabsTrigger value="mapping" className={trigger}>Anforderungen und Mapping</TabsTrigger>
          <TabsTrigger value="versionen" className={trigger}>Versionen {count(versions.length)}</TabsTrigger>
          <TabsTrigger value="verwendung" className={trigger}>Verwendung {count(usage)}</TabsTrigger>
        </TabsList>
        <TabsContent value="fragen"><QuestionTable catalog={catalog} /></TabsContent>
        <TabsContent value="mapping"><RequirementMapping catalog={catalog} /></TabsContent>
        <TabsContent value="versionen"><VersionHistory catalog={catalog} versions={versions} /></TabsContent>
        <TabsContent value="verwendung"><CatalogUsage catalogId={catalog.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
