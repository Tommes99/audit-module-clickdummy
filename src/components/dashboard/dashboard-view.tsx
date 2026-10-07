"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { dashboardStats } from "@/store/selectors";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { OpenNcTable } from "@/components/dashboard/open-nc-table";
import { DueOverview } from "@/components/dashboard/due-overview";
import { ProgrammeProgress } from "@/components/dashboard/programme-progress";
import { ReleasedReports } from "@/components/dashboard/released-reports";

export function DashboardView() {
  const data = useAppStore((s) => s.data);
  const stats = useMemo(() => dashboardStats(data), [data]);
  return (
    <div className="space-y-8">
      <KpiStrip stats={stats} />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-8">
          <OpenNcTable stats={stats} sites={data.sites} />
          <DueOverview stats={stats} />
        </div>
        <div className="min-w-0 space-y-8">
          <ProgrammeProgress stats={stats} audits={data.audits} />
          <ReleasedReports data={data} />
        </div>
      </div>
    </div>
  );
}
