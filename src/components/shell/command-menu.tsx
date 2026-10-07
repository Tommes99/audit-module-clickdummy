"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ClipboardCheck,
  FileText,
  ListTodo,
  Library,
  UserRound,
  CornerDownLeft,
  BookOpen,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navGroups } from "@/components/shell/nav-config";
import { roleLabels } from "@/domain/labels";
import { demoPersonas } from "@/domain/permissions";
import { useAppStore } from "@/store/app-store";
import { requirementMappingHref, resolveEntity } from "@/store/selectors";

/** Teilstring-Suche: alle Suchwörter müssen vorkommen (statt unscharfer Treffer wie "A-2026-09" -> A-2026-03) */
const filterItems = (value: string, search: string) => {
  const haystack = value.toLowerCase();
  return search.toLowerCase().split(/\s+/).filter(Boolean).every((t) => haystack.includes(t)) ? 1 : 0;
};

/** Schnellsuche (Strg K / Cmd K): Seiten, Audits, Feststellungen, Maßnahmen, Anforderungen, Kataloge und Rollenwechsel */
export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const [query, setQuery] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  const go = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  // Nur die neueste Version je Katalog
  const latest = new Map<string, (typeof data.catalogs)[number]>();
  for (const c of data.catalogs) {
    const known = latest.get(c.key);
    if (!known || c.version > known.version) latest.set(c.key, c);
  }
  const catalogs = [...latest.values()];

  // Anforderungen springen in das Mapping des Katalogs, der sie abfragt. Erst ab einer Eingabe, damit die Liste kurz bleibt.
  const requirements = query.trim()
    ? data.requirements.flatMap((r) => {
        const href = requirementMappingHref(data, r.id);
        return href ? [{ id: r.id, href, ...resolveEntity(data, "requirement", r.id) }] : [];
      })
    : [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Schnellsuche"
      description="Springen Sie zu Seiten, Audits, Feststellungen, Maßnahmen, Anforderungen oder wechseln Sie die Rolle."
      className="sm:max-w-xl"
    >
      <Command className="bg-transparent p-0" filter={filterItems}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Nummer, Titel oder Seite eingeben"
        />
        <CommandList className="max-h-[min(24rem,60vh)]">
          <CommandEmpty>
            Nichts gefunden. Suchen Sie nach einer Nummer wie A-2026-09 oder
            F-2026-005.
          </CommandEmpty>
          <CommandGroup heading="Seiten">
            {navGroups
              .flatMap((g) => g.items)
              .map((item) => (
                <CommandItem
                  key={item.href}
                  value={`Seite ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon aria-hidden />
                  {item.label}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Audits">
            {data.audits.map((a) => (
              <CommandItem
                key={a.id}
                value={`${a.number} ${a.title}`}
                onSelect={() => go(`/audits/${a.id}`)}
              >
                <FileText aria-hidden />
                <span className="tnum shrink-0 whitespace-nowrap font-medium">{a.number}</span>
                <span className="truncate text-muted-foreground">
                  {a.title}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Feststellungen">
            {data.findings.map((f) => (
              <CommandItem
                key={f.id}
                value={`${f.number} ${f.title}`}
                onSelect={() => go(`/feststellungen/${f.id}`)}
              >
                <ClipboardCheck aria-hidden />
                <span className="tnum shrink-0 whitespace-nowrap font-medium">{f.number}</span>
                <span className="truncate text-muted-foreground">
                  {f.title}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Maßnahmen">
            {data.actions.map((a) => (
              <CommandItem
                key={a.id}
                value={`${a.number} ${a.title}`}
                onSelect={() => go(`/feststellungen/${a.source.id}#massnahmen`)}
              >
                <ListTodo aria-hidden />
                <span className="tnum shrink-0 whitespace-nowrap font-medium">{a.number}</span>
                <span className="truncate text-muted-foreground">
                  {a.title}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Anforderungen">
            {requirements.map((r) => (
              <CommandItem key={r.id} value={`Anforderung ${r.label} ${r.title ?? ""}`} onSelect={() => go(r.href)}>
                <BookOpen aria-hidden />
                <span className="tnum shrink-0 whitespace-nowrap font-medium">{r.label}</span>
                <span className="truncate text-muted-foreground">{r.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Fragenkataloge">
            {catalogs.map((c) => (
              <CommandItem
                key={c.id}
                value={`Katalog ${c.name}`}
                onSelect={() => go(`/kataloge/${c.id}`)}
              >
                <Library aria-hidden />
                <span className="truncate">{c.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Rolle wechseln">
            {demoPersonas.map((p) => {
              const person = data.persons.find((x) => x.id === p.personId);
              if (!person) return null;
              return (
                <CommandItem
                  key={p.personId}
                  value={`Rolle ${person.name} ${roleLabels[p.role]}`}
                  disabled={p.personId === session.personId}
                  onSelect={() => {
                    setSession(p.personId, p.role);
                    go("/");
                  }}
                >
                  <UserRound aria-hidden />
                  {person.name}
                  <span className="text-muted-foreground">
                    {roleLabels[p.role]}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="size-3" aria-hidden /> Öffnen
          </span>
          <span>Pfeiltasten: auswählen</span>
          <span className="ml-auto">Esc: schließen</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
