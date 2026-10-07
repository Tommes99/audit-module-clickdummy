"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuditHeader } from "@/components/audit/audit-header";
import { FindingsTab } from "@/components/audit/findings-tab";
import { HistoryTab } from "@/components/audit/history-tab";
import { OverviewTab } from "@/components/audit/overview-tab";
import { ChecklistTab } from "@/components/checklist/checklist-tab";
import { ReportTab } from "@/components/report/report-tab";
import { Breadcrumbs, EmptyState } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { auditChecklist, auditFindings, checklistProgress } from "@/store/selectors";

const TAB_KEYS = ["uebersicht", "checkliste", "feststellungen", "bericht", "verlauf"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const isTabKey = (value: string | null): value is TabKey => TAB_KEYS.some((k) => k === value);

function AuditPageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const data = useAppStore((s) => s.data);
  const audit = useMemo(() => data.audits.find((a) => a.id === id), [data, id]);
  const progress = useMemo(() => (audit ? checklistProgress(auditChecklist(data, audit)) : undefined), [data, audit]);

  if (!audit) {
    return (
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs items={[{ label: "Audits und Jahresplan", href: "/programm" }, { label: "Audit nicht gefunden" }]} />
        <EmptyState
          action={
            <Link href="/programm" className={buttonVariants({ variant: "outline" })}>
              Zu Audits und Jahresplan
            </Link>
          }
        >
          Dieses Audit gibt es nicht. Wählen Sie ein Audit im Jahresplan.
        </EmptyState>
      </div>
    );
  }

  const param = searchParams.get("tab");
  const tab: TabKey = isTabKey(param) ? param : "uebersicht";
  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const findingCount = auditFindings(data, audit.id).length;
  const triggerClass = "min-h-9 px-3";
  const count = (text: string) => <span className="tnum text-xs font-normal text-muted-foreground">{text}</span>;

  return (
    <div className="mx-auto max-w-6xl">
      <AuditHeader audit={audit} />
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-0">
        {/* Auf schmalen Bildschirmen umbrechen statt abschneiden */}
        <TabsList variant="line" className="flex-wrap gap-y-0 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="uebersicht" className={triggerClass}>
            Übersicht und Plan
          </TabsTrigger>
          <TabsTrigger value="checkliste" className={triggerClass}>
            Checkliste
            {progress && progress.total > 0 && count(`${progress.rated}/${progress.total}`)}
          </TabsTrigger>
          <TabsTrigger value="feststellungen" className={triggerClass}>
            Feststellungen
            {findingCount > 0 && count(String(findingCount))}
          </TabsTrigger>
          <TabsTrigger value="bericht" className={triggerClass}>
            Bericht
          </TabsTrigger>
          <TabsTrigger value="verlauf" className={triggerClass}>
            Verlauf
          </TabsTrigger>
        </TabsList>
        <TabsContent value="uebersicht" className="pt-6">
          <OverviewTab audit={audit} />
        </TabsContent>
        <TabsContent value="checkliste" className="pt-6">
          <ChecklistTab auditId={audit.id} />
        </TabsContent>
        <TabsContent value="feststellungen" className="pt-6">
          <FindingsTab auditId={audit.id} />
        </TabsContent>
        <TabsContent value="bericht" className="pt-6">
          <ReportTab auditId={audit.id} />
        </TabsContent>
        <TabsContent value="verlauf" className="pt-6">
          <HistoryTab auditId={audit.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={null}>
      <AuditPageContent />
    </Suspense>
  );
}
