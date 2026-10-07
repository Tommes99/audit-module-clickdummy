import Link from "next/link";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DueText } from "@/components/shared/due-text";
import { GuardHint } from "@/components/shared/guard-hint";
import type { TaskSection } from "@/store/selectors";

/** Leertexte aus den Selektoren beginnen meist mit "Keine" oder "Alle": dann Erfolgsmeldung voranstellen */
const emptyText = (text: string) => (/^(Keine|Alle)\b/.test(text) ? `Alles erledigt. ${text}` : text);

/** Eine Aufgabenliste: dichte Zeilen, Status und Frist rechts, Hinweise direkt unter dem Eintrag */
export function TaskSectionList({ section }: { section: TaskSection }) {
  return (
    <section aria-labelledby={`sec-${section.key}`}>
      <div id={`sec-${section.key}`}>
        <SectionTitle count={section.items.length}>{section.title}</SectionTitle>
      </div>
      {section.items.length === 0 ? (
        <Panel className="py-3 text-sm text-muted-foreground">{emptyText(section.empty)}</Panel>
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-border">
            {section.items.map((item) => (
              <li key={item.key} className="relative px-4 py-3 transition-colors hover:bg-muted/40">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-foreground after:absolute after:inset-0 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      {item.title}
                    </Link>
                    {item.subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
                    {item.badge && <StatusBadge {...item.badge} />}
                    {item.dueDate && <DueText dueDate={item.dueDate} />}
                  </div>
                </div>
                <GuardHint className="mt-2.5" blockers={item.blockers} warnings={item.warnings} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}
