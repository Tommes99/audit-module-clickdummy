import { AlertTriangle, OctagonX } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardHintProps {
  blockers?: string[];
  warnings?: string[];
  className?: string;
}

function HintBox({ tone, title, items }: { tone: "danger" | "warning"; title: string; items: string[] }) {
  const Icon = tone === "danger" ? OctagonX : AlertTriangle;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "danger" ? "border-danger/25 bg-danger-soft text-danger-ink" : "border-warning/30 bg-warning-soft text-warning-ink",
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {title}
            {items.length > 1 && <span className="tnum font-normal opacity-80"> ({items.length})</span>}
          </p>
          {items.length === 1 ? (
            <p className="mt-0.5">{items[0]}</p>
          ) : (
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
              {items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Blocker (rot) und Warnungen (gelb) als Hinweisbox direkt unter dem Button. Warnungen blockieren nicht. */
export function GuardHint({ blockers = [], warnings = [], className }: GuardHintProps) {
  if (blockers.length === 0 && warnings.length === 0) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {blockers.length > 0 && <HintBox tone="danger" title="Blocker" items={blockers} />}
      {warnings.length > 0 && <HintBox tone="warning" title="Warnung" items={warnings} />}
    </div>
  );
}
