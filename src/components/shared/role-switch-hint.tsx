"use client";

import { Button } from "@/components/ui/button";
import { can, demoPersonas, type Permission, type PermissionContext } from "@/domain/permissions";
import { roleLabels } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";

interface RoleSwitchHintProps {
  permission: Permission;
  ctx?: PermissionContext;
  /** Satz davor, z. B. "Maßnahmen legen Auditees und Maßnahmenverantwortliche an." */
  lead: string;
}

/**
 * Sichtbarer Hinweis statt stummem Tooltip, wenn die aktuelle Rolle eine Aktion nicht ausführen darf:
 * nennt den Grund und bietet den Wechsel zu einer Demo-Rolle an, die es darf.
 */
export function RoleSwitchHint({ permission, ctx, lead }: RoleSwitchHintProps) {
  const session = useAppStore((s) => s.session);
  const persons = useAppStore((s) => s.data.persons);
  const setSession = useAppStore((s) => s.setSession);
  const candidate = demoPersonas.find((p) => p.personId !== session.personId && can(p, permission, ctx).allowed);
  const name = persons.find((p) => p.id === candidate?.personId)?.name;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <p className="min-w-0 flex-1">{lead}</p>
      {candidate && name && (
        <Button size="sm" variant="outline" onClick={() => setSession(candidate.personId, candidate.role)}>
          Als {name} fortfahren
          <span className="sr-only">, {roleLabels[candidate.role]}</span>
        </Button>
      )}
    </div>
  );
}
