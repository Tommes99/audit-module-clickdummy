"use client";

import { useMemo } from "react";
import { FileText, Image as ImageIcon, Link2, MessageSquareText } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { publishedEvidenceFor } from "@/store/selectors";
import { evidenceKindLabels, formatDateTime } from "@/domain/labels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/page-header";
import type { EvidenceKind, ID } from "@/types/domain";

const kindIcons: Record<EvidenceKind, typeof FileText> = {
  file: FileText,
  photo: ImageIcon,
  document_link: Link2,
  interview_note: MessageSquareText,
};

const formatSize = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);

/** Nachweise einer ID-Liste mit Art, Datei, Größe, gekürztem Hash (voll im Tooltip), Person und Zeit */
export function EvidenceList({ evidenceIds, emptyText }: { evidenceIds: ID[]; emptyText?: string }) {
  const data = useAppStore((s) => s.data);
  const items = useMemo(() => publishedEvidenceFor(data, evidenceIds), [data, evidenceIds]);

  if (items.length === 0) {
    return <EmptyState>{emptyText ?? "Noch kein Nachweis. Hängen Sie ein Foto, eine Datei oder einen Dokumentlink an."}</EmptyState>;
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {items.map((e) => {
        const Icon = kindIcons[e.kind];
        const uploader = data.persons.find((p) => p.id === e.uploadedById)?.name ?? "";
        return (
          <li key={e.id} className="flex items-start gap-3 px-3 py-2.5 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-medium leading-snug">{e.title}</p>
              <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>{evidenceKindLabels[e.kind]}</span>
                {e.fileName && (
                  <span className="break-all">
                    {e.fileName}
                    {e.sizeBytes ? `, ${formatSize(e.sizeBytes)}` : ""}
                  </span>
                )}
                {e.url && <span className="break-all font-mono">{e.url}</span>}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  {uploader}, <span className="tnum">{formatDateTime(e.uploadedAt)}</span>
                </span>
                {e.sha256 && (
                  <Tooltip>
                    <TooltipTrigger render={<span tabIndex={0} className="font-mono" />}>SHA-256 {e.sha256.slice(0, 8)}</TooltipTrigger>
                    <TooltipContent className="max-w-xs break-all font-mono">
                      {e.sha256}
                      <span className="mt-1 block font-sans">Demo-Hash, nicht kryptografisch. Produktiv SHA-256 serverseitig.</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </p>
              {e.containsPersonalData && <p className="text-xs text-warning-ink">Enthält personenbezogene Daten</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
