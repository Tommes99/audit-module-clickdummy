"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ActionsTable } from "@/components/actions/actions-table";

export default function ActionsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Maßnahmen" help="actions.page" />
      <Suspense fallback={null}>
        <ActionsTable />
      </Suspense>
    </div>
  );
}
