"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgrammeHeader } from "@/components/programmes/programme-header";
import { AnnualPlan } from "@/components/programmes/annual-plan";
import { CoverageMatrix } from "@/components/programmes/coverage-matrix";

const TABS = ["jahresplan", "abdeckung"] as const;
type TabKey = (typeof TABS)[number];

function ProgrammeTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: TabKey = TABS.find((t) => t === raw) ?? "jahresplan";

  return (
    <Tabs value={tab} onValueChange={(v) => router.replace(`/programm?tab=${v}`, { scroll: false })}>
      <TabsList variant="line">
        <TabsTrigger value="jahresplan" className="min-h-10">
          Jahresplan
        </TabsTrigger>
        <TabsTrigger value="abdeckung" className="min-h-10">
          Abdeckungsmatrix
        </TabsTrigger>
      </TabsList>
      <TabsContent value="jahresplan" className="pt-4">
        <AnnualPlan />
      </TabsContent>
      <TabsContent value="abdeckung" className="pt-4">
        <CoverageMatrix />
      </TabsContent>
    </Tabs>
  );
}

export default function ProgrammePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <ProgrammeHeader />
      <Suspense fallback={null}>
        <ProgrammeTabs />
      </Suspense>
    </div>
  );
}
