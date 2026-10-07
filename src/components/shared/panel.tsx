import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fläche für zusammengehörige Inhalte: heller Grund, feine Linie, kein Schatten. Karten nur für echte Gruppen, nicht als Raster. */
export function Panel({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <div className={cn("overflow-hidden rounded-lg border border-border bg-card", padded && "p-4", className)}>{children}</div>;
}
