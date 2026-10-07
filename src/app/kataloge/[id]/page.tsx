import { Suspense } from "react";
import { CatalogDetail } from "@/components/catalogs/catalog-detail";

export default function CatalogDetailPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* useSearchParams (Tab aus der URL) braucht eine Suspense-Grenze */}
      <Suspense>
        <CatalogDetail />
      </Suspense>
    </div>
  );
}
