import type { AiTarget } from "@/store/commands/ai";
import type { Audit } from "@/types/domain";

/** Ziel der KI-Entscheidung beim Verwerfen: Es gibt noch keinen Bericht, daher das Audit */
export const rejectionTarget = (audit: Audit): AiTarget => ({
  entityType: "audit",
  entityId: audit.id,
  auditId: audit.id,
  label: audit.number,
});
