import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Eintrag mit leerem Wert, z. B. "Bitte wählen" */
  placeholder?: string;
}

/** Einfaches natives Auswahlfeld: tablet-tauglich, tastaturbedienbar, im Look der Eingabefelder */
export function NativeSelect({ value, onChange, options, placeholder, className, ...props }: NativeSelectProps) {
  return (
    <select
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
