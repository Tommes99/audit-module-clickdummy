"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Menu, Route, ShieldCheck } from "lucide-react";
import { CommandMenu } from "@/components/shell/command-menu";
import { SearchTrigger } from "@/components/shell/search-trigger";
import { RoleSwitcher } from "@/components/shell/role-switcher";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { TourSheet } from "@/components/shell/tour-sheet";
import { HelpHint } from "@/components/shared/help-hint";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/domain/labels";
import { DEMO_TODAY } from "@/domain/workflows";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-1">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-[18px]" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Audit-Modul</span>
        <span className="block text-xs text-muted-foreground">Muster Metall GmbH</span>
      </span>
    </Link>
  );
}

function TourButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="w-full justify-start gap-2.5" onClick={onClick}>
      <Route className="text-primary" aria-hidden /> Demo-Rundgang
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-5 border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        <Brand />
        <div className="scrollbar-quiet -mr-1 flex-1 overflow-y-auto pr-1">
          <Suspense fallback={null}>
            <SidebarNav />
          </Suspense>
        </div>
        <TourButton onClick={() => setTourOpen(true)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Navigation öffnen">
            <Menu aria-hidden />
          </Button>
          <div className="min-w-0 flex-1">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <span>
              Demo, Stand <span className="tnum font-medium text-foreground">{formatDate(DEMO_TODAY)}</span>
            </span>
            <HelpHint topic="shell.demo" />
          </div>
          <RoleSwitcher />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 gap-5 px-3 py-4 sm:max-w-xs">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Hauptnavigation des Audit-Moduls</SheetDescription>
          <Brand />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={null}>
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </Suspense>
          </div>
          <TourButton
            onClick={() => {
              setMenuOpen(false);
              setTourOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
      <TourSheet open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
