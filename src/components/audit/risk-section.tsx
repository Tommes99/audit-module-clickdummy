import { RiskBadge } from "@/components/shared/status-badge";
import { SectionTitle } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import type { Audit } from "@/types/domain";

/** Risikoeinstufung mit Begründung der risikobasierten Planung */
export function RiskSection({ audit }: { audit: Audit }) {
  const { riskLevel, reasons } = audit.planningRationale;
  return (
    <section aria-labelledby="sec-risk">
      <div id="sec-risk">
        <SectionTitle help="audit.risk" actions={<RiskBadge level={riskLevel} />}>
          Risikoeinstufung
        </SectionTitle>
      </div>
      <Panel>
        {reasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Begründung hinterlegt. Ergänzen Sie diese im Auditprogramm.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-4 text-sm marker:text-border">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  );
}
