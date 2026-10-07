import { dueState, relativeDueText } from "@/domain/rules";
import { DEMO_TODAY } from "@/domain/workflows";
import { formatDate } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { ISODate } from "@/types/domain";

/** Frist mit Datum (de-DE) und relativem Text. Überfällig in Rot, bald fällig in Gelb, immer mit Text. */
export function DueText({ dueDate, done = false }: { dueDate?: ISODate; done?: boolean }) {
  if (!dueDate) return <span className="text-muted-foreground">Keine Frist</span>;
  const state = done ? "none" : dueState(dueDate, DEMO_TODAY);
  return (
    <span className="tnum">
      {formatDate(dueDate)}
      {!done && (
        <span
          className={cn(
            "ml-1.5 text-xs",
            state === "overdue" && "font-medium text-danger-ink",
            state === "due_soon" && "font-medium text-warning-ink",
            (state === "on_track" || state === "none") && "text-muted-foreground",
          )}
        >
          ({relativeDueText(dueDate, DEMO_TODAY)})
        </span>
      )}
    </span>
  );
}
