"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AuditStatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { TransitionButton } from "@/components/shared/transition-button";
import { GuardSummary } from "@/components/audit/guard-summary";
import { auditTransitionConfig, forwardTransition } from "@/components/audit/transitions";
import { useCan } from "@/hooks/use-can";
import { auditTypeLabels, formatDate } from "@/domain/labels";
import { requiresReason } from "@/domain/workflows";
import { useAppStore } from "@/store/app-store";
import { auditOverview, personName } from "@/store/selectors";
import type { Audit } from "@/types/domain";

/** Kopf der Audit-Seite: Eckdaten, Statuswechsel-Buttons und direkt darunter Blocker und Warnungen */
export function AuditHeader({ audit }: { audit: Audit }) {
  const data = useAppStore((s) => s.data);
  const transitionAudit = useAppStore((s) => s.transitionAudit);
  const can = useCan();
  const overview = useMemo(() => auditOverview(data, audit), [data, audit]);

  const next = forwardTransition[audit.status];
  const nextGuard = overview.transitions.find((t) => t.to === next)?.guard;

  const buttons = overview.transitions.flatMap(({ to, guard }) => {
    const config = auditTransitionConfig[`${audit.status}->${to}`];
    // Die Freigabe löst der Bericht-Tab aus
    if (!config) return [];
    const permission = can(config.permission, { audit });
    const needsReason = requiresReason("audit", audit.status, to);
    const isCancel = to === "cancelled";
    return [
      <TransitionButton
        key={to}
        label={config.label}
        variant={isCancel || to === "planned" || audit.status === "reporting" ? "outline" : "default"}
        run={(reason) => transitionAudit(audit.id, to, reason)}
        successMessage={config.success}
        blockers={guard.blockers}
        deniedReason={permission.allowed ? undefined : permission.reason}
        reasonDialog={
          needsReason
            ? { title: config.reasonTitle ?? config.label, description: config.reasonDescription, confirmLabel: config.label }
            : undefined
        }
      />,
    ];
  });

  const site = audit.siteId ? data.sites.find((x) => x.id === audit.siteId)?.name : undefined;
  const facts = [
    auditTypeLabels[audit.type],
    audit.siteId ? (site ?? audit.siteId) : `Lieferant: ${audit.supplierName ?? "nicht angegeben"}`,
    audit.certificationBody ? `Zertifizierungsstelle: ${audit.certificationBody}` : null,
    `${formatDate(audit.plannedStart)} bis ${formatDate(audit.plannedEnd)}`,
    `Leitung: ${personName(data, audit.leadAuditorId)}`,
  ].filter((x): x is string => Boolean(x));

  const meta = (
    <>
      <AuditStatusBadge status={audit.status} />
      <span className="tnum flex flex-wrap items-center gap-x-2">
        {facts.map((f, i) => (
          <span key={f} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-muted-foreground/50">·</span>}
            {f}
          </span>
        ))}
      </span>
    </>
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Audits und Jahresplan", href: "/programm" }, { label: audit.number }]}
        title={
          <>
            <span className="tnum">{audit.number}</span> {audit.title}
          </>
        }
        help="audit.workflow"
        meta={meta}
        actions={buttons}
      />
      {audit.status === "reporting" && (
        <p className="-mt-3 mb-4 text-sm text-muted-foreground">
          Die Freigabe erfolgt im Tab{" "}
          <Link href={`/audits/${audit.id}?tab=bericht`} scroll={false} className="text-primary underline underline-offset-2">
            Bericht
          </Link>
          .
        </p>
      )}
      {next && next !== "released" && nextGuard && (
        <div className="-mt-2">
          <GuardSummary blockers={nextGuard.blockers} warnings={nextGuard.warnings} />
        </div>
      )}
    </div>
  );
}
