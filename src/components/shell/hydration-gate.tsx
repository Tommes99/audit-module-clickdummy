"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useAppStore } from "@/store/app-store";

const subscribe = (onChange: () => void) => useAppStore.persist.onFinishHydration(onChange);
const isHydrated = () => useAppStore.persist.hasHydrated();
const isServer = () => false;

/**
 * Rendert Inhalte erst nach der Hydrierung des persistierten Stores,
 * damit Server- und Client-HTML nicht auseinanderlaufen (localStorage).
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(subscribe, isHydrated, isServer);
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
        <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden />
        Demo wird geladen
      </div>
    );
  }
  return <>{children}</>;
}
