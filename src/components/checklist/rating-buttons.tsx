"use client";

import { Check } from "lucide-react";
import { checklistRatingLabels } from "@/domain/labels";
import { cn } from "@/lib/utils";
import type { ChecklistRating } from "@/types/domain";

const order: ChecklistRating[] = ["conform", "deviation", "not_applicable"];

/** Farbe nur als Zusatz: aktiver Zustand zeigt immer Haken, Text und aria-pressed */
const activeClasses: Record<ChecklistRating, string> = {
  conform: "border-success bg-success-soft text-success-ink",
  deviation: "border-danger bg-danger-soft text-danger-ink",
  not_applicable: "border-foreground/40 bg-muted text-foreground",
};

interface RatingButtonsProps {
  value: ChecklistRating | null;
  disabled?: boolean;
  onRate: (rating: ChecklistRating) => void;
  className?: string;
}

/** Drei große Schaltflächen (Touch-Ziele, mindestens 44 px) für die Bewertung eines Checklistenpunkts */
export function RatingButtons({ value, disabled, onRate, className }: RatingButtonsProps) {
  return (
    <div role="group" aria-label="Bewertung" className={cn("grid grid-cols-3 gap-1.5", className)}>
      {order.map((rating) => {
        const active = value === rating;
        return (
          <button
            key={rating}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onRate(rating)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-center text-[13px] font-medium leading-tight outline-none transition-colors",
              "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              active ? activeClasses[rating] : "border-border bg-card text-foreground/80 hover:border-primary hover:text-primary disabled:hover:border-border disabled:hover:text-foreground/80",
            )}
          >
            {active && <Check className="size-3.5 shrink-0" aria-hidden />}
            {checklistRatingLabels[rating].label}
          </button>
        );
      })}
    </div>
  );
}
