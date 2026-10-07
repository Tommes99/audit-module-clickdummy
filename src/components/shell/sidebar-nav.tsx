"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { navGroups } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { dashboardStats, tasksFor } from "@/store/selectors";

/** Navigation in Gruppen mit Zählern (offene Aufgaben, überfällige Maßnahmen) */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const data = useAppStore((s) => s.data);
  const session = useAppStore((s) => s.session);
  const counters = useMemo(
    () => ({
      tasks: tasksFor(data, session).reduce((n, s) => n + s.items.length, 0),
      overdue: dashboardStats(data).actions.overdue,
    }),
    [data, session],
  );

  return (
    <nav aria-label="Hauptnavigation" className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.isActive(pathname, tab);
              const count = item.counter ? counters[item.counter] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "tnum rounded-full px-1.5 text-xs font-medium",
                          item.counter === "overdue" ? "bg-danger-soft text-danger-ink" : "bg-muted text-muted-foreground",
                        )}
                        title={item.counter === "overdue" ? `${count} überfällig` : `${count} offen`}
                      >
                        {count}
                        <span className="sr-only">{item.counter === "overdue" ? " überfällig" : " offen"}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
