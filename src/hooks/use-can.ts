"use client";

import { useCallback } from "react";
import { can, type Permission, type PermissionContext, type PermissionResult } from "@/domain/permissions";
import { useAppStore } from "@/store/app-store";

/** Rechteprüfung für die aktuelle Persona: `const can = useCan(); can("plan_audit").reason` für den Tooltip */
export function useCan() {
  const session = useAppStore((s) => s.session);
  return useCallback((permission: Permission, ctx?: PermissionContext): PermissionResult => can(session, permission, ctx), [session]);
}
