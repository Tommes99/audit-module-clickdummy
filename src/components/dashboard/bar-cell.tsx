/** Ruhiger Balken per CSS-Breite, immer mit Zahl daneben */
export function BarCell({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="tnum w-6 text-right text-sm font-semibold">{value}</span>
      <div className="h-1.5 min-w-16 flex-1 rounded-full bg-muted" role="img" aria-label={label ?? `${value} von ${max}`}>
        <div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
