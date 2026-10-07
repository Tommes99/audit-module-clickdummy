import { toast } from "sonner";
import type { ActionResult } from "@/store/helpers";

/**
 * Zeigt das Ergebnis einer Store-Action: Blocker als roter Toast, Warnungen als gelber Toast,
 * bei Erfolg optional eine Meldung. Gibt zurück, ob die Action erfolgreich war.
 */
export function notify(result: ActionResult, successMessage?: string): boolean {
  if (!result.ok) {
    toast.error(result.blockers.length === 1 ? result.blockers[0] : "Aktion nicht möglich", {
      description: result.blockers.length > 1 ? result.blockers.join(" ") : undefined,
    });
    return false;
  }
  if (successMessage) toast.success(successMessage);
  if (result.warnings.length > 0) {
    toast.warning("Hinweis", { description: result.warnings.join(" ") });
  }
  return true;
}
