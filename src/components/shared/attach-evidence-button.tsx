"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GuardedButton } from "@/components/shared/guarded-button";
import { NativeSelect } from "@/components/shared/native-select";
import { evidenceKindLabels } from "@/domain/labels";
import { useAppStore } from "@/store/app-store";
import type { EvidenceDraft, EvidenceTarget } from "@/store/commands/checklist";
import { notify } from "@/lib/notify";
import type { EvidenceKind } from "@/types/domain";

interface AttachEvidenceButtonProps {
  target: EvidenceTarget;
  label?: string;
  defaultKind?: EvidenceKind;
  deniedReason?: string;
  size?: "sm" | "default";
}

const kinds = (Object.keys(evidenceKindLabels) as EvidenceKind[]).map((k) => ({ value: k, label: evidenceKindLabels[k] }));

/** Simulierter Upload: Dateiname und Größe werden übernommen, der Hash entsteht per demoDigest() im Store */
export function AttachEvidenceButton({ target, label = "Nachweis anhängen", defaultKind = "file", deniedReason, size = "sm" }: AttachEvidenceButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <GuardedButton type="button" variant="outline" size={size} deniedReason={deniedReason} onClick={() => setOpen(true)}>
        <Paperclip aria-hidden /> {label}
      </GuardedButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>{open && <EvidenceForm target={target} defaultKind={defaultKind} onClose={() => setOpen(false)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function EvidenceForm({ target, defaultKind, onClose }: { target: EvidenceTarget; defaultKind: EvidenceKind; onClose: () => void }) {
  const attachEvidence = useAppStore((s) => s.attachEvidence);
  const [kind, setKind] = useState<EvidenceKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<{ fileName: string; sizeBytes: number; mimeType: string } | null>(null);

  const needsFile = kind === "file" || kind === "photo";
  const simulatePhoto = () =>
    setFile({ fileName: `foto-${String(Date.now()).slice(-6)}.jpg`, sizeBytes: 1_204_000, mimeType: "image/jpeg" });

  const submit = () => {
    const draft: EvidenceDraft = { kind, title, ...(needsFile && file ? file : {}), ...(kind === "document_link" ? { url } : {}) };
    if (notify(attachEvidence(target, draft), `${evidenceKindLabels[kind]} angehängt`)) onClose();
  };
  const incomplete = !title.trim() || (needsFile && !file) || (kind === "document_link" && !url.trim());

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nachweis anhängen</DialogTitle>
        <DialogDescription>Im Dummy wird nichts hochgeladen. Dateiname und Größe werden übernommen, der Hash wird simuliert.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ev-kind">Art</Label>
          <NativeSelect id="ev-kind" value={kind} onChange={(v) => { setKind(v as EvidenceKind); setFile(null); }} options={kinds} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-title">Bezeichnung</Label>
          <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Gasse 4 ohne markierten Fußgängerweg" />
        </div>
        {needsFile && (
          <div className="space-y-1.5">
            <Label htmlFor="ev-file">Datei</Label>
            <Input
              id="ev-file"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ? { fileName: f.name, sizeBytes: f.size, mimeType: f.type || "application/octet-stream" } : null);
              }}
            />
            {kind === "photo" && (
              <Button type="button" variant="outline" size="sm" onClick={simulatePhoto}>
                Beispielfoto verwenden
              </Button>
            )}
            {file && <p className="text-xs text-muted-foreground">Gewählt: {file.fileName}</p>}
          </div>
        )}
        {kind === "document_link" && (
          <div className="space-y-1.5">
            <Label htmlFor="ev-url">Verweis in die Dokumentenlenkung</Label>
            <Input id="ev-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="dms://as/gbu/..." />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button onClick={submit} disabled={incomplete}>
          Anhängen
        </Button>
      </DialogFooter>
    </>
  );
}
