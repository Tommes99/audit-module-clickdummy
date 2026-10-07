import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { HelpHint } from "@/components/shared/help-hint";
import type { HelpTopic } from "@/domain/help";

export interface Crumb {
  label: string;
  href?: string;
}

/** Brotkrumen: zeigen, wo man ist, und führen mit einem Klick zurück */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Brotkrumen" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 opacity-60" aria-hidden />}
            {c.href ? (
              <Link href={c.href} className="rounded px-0.5 hover:text-primary hover:underline underline-offset-2">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="px-0.5 text-foreground/70">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
  breadcrumbs,
  help,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Badges und Eckdaten unter dem Titel */
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Erklärung hinter dem "?" neben dem Titel */
  help?: HelpTopic;
}) {
  return (
    <header className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 space-y-1.5">
          <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[22px] font-semibold leading-tight tracking-tight">
            <span className="min-w-0">{title}</span>
            {help && <HelpHint topic={help} />}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionTitle({
  children,
  actions,
  help,
  count,
}: {
  children: ReactNode;
  actions?: ReactNode;
  help?: HelpTopic;
  /** Anzahl hinter dem Titel, z. B. Einträge der Liste */
  count?: number;
}) {
  return (
    <div className="mb-2.5 flex min-h-6 items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {children}
        {count !== undefined && <span className="tnum rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">{count}</span>}
        {help && <HelpHint topic={help} />}
      </h2>
      {actions}
    </div>
  );
}

/** Leerzustand: nennt, was zu tun ist */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-input bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
      <p className="max-w-md">{children}</p>
      {action}
    </div>
  );
}

/** Beschriftete Eckdaten als dichte Definitionsliste */
export function FactList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,max-content)_1fr] gap-x-4 gap-y-2 text-sm">
      {items.map((i, idx) => (
        <div key={idx} className="contents">
          <dt className="text-muted-foreground">{i.label}</dt>
          <dd className="min-w-0">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
