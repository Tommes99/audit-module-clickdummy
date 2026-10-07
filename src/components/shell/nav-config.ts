import {
  CalendarRange,
  ClipboardCheck,
  Grid3x3,
  History,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Library,
  Plug,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Zähler hinter dem Eintrag */
  counter?: "tasks" | "overdue";
  /** Wann der Eintrag als aktiv gilt */
  isActive: (pathname: string, tab: string | null) => boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Navigation nach Arbeitsablauf: erst tun, dann planen, dann auswerten */
export const navGroups: NavGroup[] = [
  {
    title: "Arbeit",
    items: [
      { href: "/", label: "Meine Aufgaben", icon: Inbox, counter: "tasks", isActive: (p) => p === "/" },
      { href: "/feststellungen", label: "Feststellungen", icon: ClipboardCheck, isActive: startsWith("/feststellungen") },
      { href: "/massnahmen", label: "Maßnahmen", icon: ListTodo, counter: "overdue", isActive: startsWith("/massnahmen") },
    ],
  },
  {
    title: "Planung",
    items: [
      {
        href: "/programm",
        label: "Audits und Jahresplan",
        icon: CalendarRange,
        isActive: (p, tab) => (startsWith("/programm")(p) && tab !== "abdeckung") || startsWith("/audits")(p),
      },
      {
        href: "/programm?tab=abdeckung",
        label: "Abdeckungsmatrix",
        icon: Grid3x3,
        isActive: (p, tab) => startsWith("/programm")(p) && tab === "abdeckung",
      },
      { href: "/kataloge", label: "Fragenkataloge", icon: Library, isActive: startsWith("/kataloge") },
    ],
  },
  {
    title: "Auswertung",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, isActive: startsWith("/dashboard") },
      { href: "/verlauf", label: "Verlauf", icon: History, isActive: startsWith("/verlauf") },
    ],
  },
  {
    title: "Konzept",
    items: [{ href: "/integrationen", label: "Integrationen", icon: Plug, isActive: startsWith("/integrationen") }],
  },
];
