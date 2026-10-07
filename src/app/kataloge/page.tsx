import { PageHeader } from "@/components/shared/page-header";
import { CatalogList } from "@/components/catalogs/catalog-list";

export default function CatalogsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Fragenkataloge" help="catalogs.page" />
      <CatalogList />
    </div>
  );
}
