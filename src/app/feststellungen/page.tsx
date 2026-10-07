"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FindingsList } from "@/components/findings-list/findings-list";

export default function FindingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Feststellungen" help="findings.page" />
      <Suspense fallback={null}>
        <FindingsList />
      </Suspense>
    </div>
  );
}
