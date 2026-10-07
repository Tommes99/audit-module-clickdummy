import { PageHeader } from "@/components/shared/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { formatDate } from "@/domain/labels";
import { DEMO_TODAY } from "@/domain/workflows";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Dashboard" help="dashboard.page" meta={<span>{`Stand ${formatDate(DEMO_TODAY)} (Demo-Datum)`}</span>} />
      <DashboardView />
    </div>
  );
}
