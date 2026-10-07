"use client";

import { useState } from "react";
import { NativeSelect } from "@/components/shared/native-select";
import { Label } from "@/components/ui/label";
import { ReportStatusBadge, StatusBadge } from "@/components/shared/status-badge";
import { Panel } from "@/components/shared/panel";
import { SectionTitle } from "@/components/shared/page-header";
import type { AuditReport } from "@/types/domain";

interface Field {
  label: string;
  text: (r: AuditReport) => string;
  render: (r: AuditReport) => React.ReactNode;
}

const fields: Field[] = [
  { label: "Zusammenfassung", text: (r) => r.summary, render: (r) => <p>{r.summary || "Leer"}</p> },
  { label: "Gesamtbewertung", text: (r) => r.conclusion, render: (r) => <p>{r.conclusion || "Leer"}</p> },
  {
    label: "Stärken",
    text: (r) => r.strengths.join("\n"),
    render: (r) =>
      r.strengths.length === 0 ? (
        <p>Leer</p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-5">
          {r.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ),
  },
];

/** Zwei Versionen nebeneinander. Geänderte Felder tragen das Badge "Geändert". Reports: neueste zuerst. */
export function VersionCompare({ reports }: { reports: AuditReport[] }) {
  const [olderId, setOlderId] = useState(reports[1].id);
  const [newerId, setNewerId] = useState(reports[0].id);
  const a = reports.find((r) => r.id === olderId) ?? reports[1];
  const b = reports.find((r) => r.id === newerId) ?? reports[0];
  const [left, right] = a.version <= b.version ? [a, b] : [b, a];
  const options = reports.map((r) => ({ value: r.id, label: `Version ${r.version}` }));

  return (
    <section aria-labelledby="compare-title" className="space-y-3">
      <div id="compare-title">
        <SectionTitle>
          Version <span className="tnum">{left.version}</span> und <span className="tnum">{right.version}</span> vergleichen
        </SectionTitle>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="cmp-a" className="text-xs text-muted-foreground">Erste Version</Label>
          <NativeSelect id="cmp-a" className="w-40" value={olderId} onChange={setOlderId} options={options} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cmp-b" className="text-xs text-muted-foreground">Zweite Version</Label>
          <NativeSelect id="cmp-b" className="w-40" value={newerId} onChange={setNewerId} options={options} />
        </div>
      </div>
      {left.id === right.id ? (
        <p className="text-sm text-muted-foreground">Wählen Sie zwei verschiedene Versionen.</p>
      ) : (
        <>
          <p className="max-w-[72ch] text-sm">
            <span className="font-medium">Änderungsgrund Version {right.version}:</span> {right.changeReason ?? "Nicht angegeben"}
          </p>
          <Panel padded={false} className="divide-y divide-border">
            <div className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm font-medium">
              {[left, right].map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  Version <span className="tnum">{r.version}</span> <ReportStatusBadge status={r.status} />
                </div>
              ))}
            </div>
            {fields.map((f) => {
              const changed = f.text(left) !== f.text(right);
              return (
                <div key={f.label} className="px-4 py-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {f.label}
                    {changed ? <StatusBadge label="Geändert" tone="warning" /> : <span className="font-normal">Unverändert</span>}
                  </p>
                  <div className="grid gap-6 text-sm leading-relaxed sm:grid-cols-2">
                    <div>{f.render(left)}</div>
                    <div className={changed ? "border-l-2 border-warning pl-3 sm:border-l-2" : ""}>{f.render(right)}</div>
                  </div>
                </div>
              );
            })}
          </Panel>
        </>
      )}
    </section>
  );
}
