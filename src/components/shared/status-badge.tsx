import { Sparkles } from "lucide-react";
import type {
  ActionStatus,
  AuditStatus,
  CatalogStatus,
  ChecklistRating,
  EffectivenessResult,
  FindingClassification,
  FindingStatus,
  ReportStatus,
  RiskLevel,
} from "@/types/domain";
import {
  actionStatusLabels,
  auditStatusLabels,
  catalogStatusLabels,
  checklistRatingLabels,
  effectivenessResultLabels,
  findingClassificationLabels,
  findingStatusLabels,
  reportStatusLabels,
  riskLevelLabels,
  type LabelDef,
  type Tone,
} from "@/domain/labels";
import { cn } from "@/lib/utils";

/** Ruhige Badges: neutral mit farbigem Punkt, nur Warnung und Gefahr sind getönt. Der Text trägt immer die Bedeutung. */
const toneClasses: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "border-border bg-card text-neutral-ink", dot: "bg-muted-foreground/70" },
  muted: { badge: "border-border bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground/40" },
  info: { badge: "border-border bg-card text-foreground", dot: "bg-primary" },
  progress: { badge: "border-primary/25 bg-info-soft text-info-ink", dot: "bg-primary" },
  success: { badge: "border-border bg-card text-foreground", dot: "bg-success" },
  warning: { badge: "border-warning/30 bg-warning-soft text-warning-ink", dot: "bg-warning" },
  danger: { badge: "border-danger/25 bg-danger-soft text-danger-ink", dot: "bg-danger" },
};

/** Status nie nur über Farbe: das Badge enthält immer den Text. Texte kommen aus labels.ts. */
export function StatusBadge({ label, tone, className }: LabelDef & { className?: string }) {
  const t = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs font-medium",
        t.badge,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
      {label}
    </span>
  );
}

export const AuditStatusBadge = ({ status }: { status: AuditStatus }) => <StatusBadge {...auditStatusLabels[status]} />;
export const FindingStatusBadge = ({ status }: { status: FindingStatus }) => <StatusBadge {...findingStatusLabels[status]} />;
export const ActionStatusBadge = ({ status }: { status: ActionStatus }) => <StatusBadge {...actionStatusLabels[status]} />;
export const ReportStatusBadge = ({ status }: { status: ReportStatus }) => <StatusBadge {...reportStatusLabels[status]} />;
export const RatingBadge = ({ rating }: { rating: ChecklistRating }) => <StatusBadge {...checklistRatingLabels[rating]} />;
export const RiskBadge = ({ level }: { level: RiskLevel }) => <StatusBadge {...riskLevelLabels[level]} />;
export const CatalogStatusBadge = ({ status }: { status: CatalogStatus }) => <StatusBadge {...catalogStatusLabels[status]} />;
export const EffectivenessBadge = ({ result }: { result: EffectivenessResult }) => (
  <StatusBadge {...effectivenessResultLabels[result]} />
);

export function ClassificationBadge({ classification }: { classification: FindingClassification }) {
  const def = findingClassificationLabels[classification];
  return <StatusBadge label={def.label} tone={def.tone} />;
}

/** Kennzeichnung KI-gestützter Inhalte, bewusst nicht wegklickbar */
export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full border border-primary/25 bg-info-soft px-2 text-xs font-medium text-info-ink",
        className,
      )}
      title="Inhalt wurde mit KI-Unterstützung erstellt und von einem Menschen geprüft"
    >
      <Sparkles aria-hidden className="size-3" />
      KI-gestützt
    </span>
  );
}
