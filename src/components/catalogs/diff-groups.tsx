import { ReqChips } from "@/components/catalogs/req-chip";
import { Panel } from "@/components/shared/panel";
import { cn } from "@/lib/utils";
import type { CatalogQuestion } from "@/types/domain";
import type { ChangedQuestion } from "@/components/catalogs/diff";

type Kind = "added" | "changed" | "removed";

/** Text trägt die Bedeutung, das Zeichen davor ist nur Unterstützung */
const kinds: Record<Kind, { label: string; sign: string; tag: string }> = {
  added: { label: "Hinzugefügt", sign: "+", tag: "border-success/30 bg-success-soft text-success-ink" },
  changed: { label: "Geändert", sign: "~", tag: "border-warning/30 bg-warning-soft text-warning-ink" },
  removed: { label: "Entfernt", sign: "−", tag: "border-danger/30 bg-danger-soft text-danger-ink" },
};

export function DiffTag({ kind, count }: { kind: Kind; count?: number }) {
  const k = kinds[kind];
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-xs font-medium", k.tag)}>
      <span aria-hidden className="font-mono">{k.sign}</span>
      <span className="tnum">{count === undefined ? k.label : `${k.label}: ${count}`}</span>
    </span>
  );
}

function Group({ kind, count, children, empty }: { kind: Kind; count: number; children: React.ReactNode; empty: string }) {
  return (
    <section aria-label={`${kinds[kind].label}, ${count}`} className="space-y-2">
      <DiffTag kind={kind} count={count} />
      {count === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-border">{children}</ul>
        </Panel>
      )}
    </section>
  );
}

const QuestionRow = ({ q }: { q: CatalogQuestion }) => (
  <li className="space-y-1.5 px-3 py-2.5 text-sm">
    <p>{q.text}</p>
    <ReqChips ids={q.requirementIds} />
  </li>
);

export function AddedGroup({ questions, version }: { questions: CatalogQuestion[]; version: number }) {
  return (
    <Group kind="added" count={questions.length} empty={`Keine Frage ist in Version ${version} hinzugekommen.`}>
      {questions.map((q) => <QuestionRow key={q.id} q={q} />)}
    </Group>
  );
}

export function RemovedGroup({ questions, version }: { questions: CatalogQuestion[]; version: number }) {
  return (
    <Group kind="removed" count={questions.length} empty={`Keine Frage wurde seit Version ${version} entfernt.`}>
      {questions.map((q) => <QuestionRow key={q.id} q={q} />)}
    </Group>
  );
}

export function ChangedGroup({ items }: { items: ChangedQuestion[] }) {
  return (
    <Group kind="changed" count={items.length} empty="Keine Frage wurde inhaltlich geändert.">
      {items.map((c) => (
        <li key={c.after.id} className="space-y-1.5 px-3 py-2.5 text-sm">
          <p className="text-xs text-muted-foreground">Geändert: {c.what.join(", ")}</p>
          <p><span className="text-xs text-muted-foreground">Vorher: </span>{c.before.text}</p>
          <p><span className="text-xs text-muted-foreground">Nachher: </span>{c.after.text}</p>
          <ReqChips ids={c.after.requirementIds} />
        </li>
      ))}
    </Group>
  );
}
