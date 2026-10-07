"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GuardedButton } from "@/components/shared/guarded-button";
import { TransitionButton } from "@/components/shared/transition-button";
import { useCan } from "@/hooks/use-can";
import { checkCreateCatalogDraft, checkReleaseCatalog } from "@/domain/rules";
import { notify } from "@/lib/notify";
import { useAppStore } from "@/store/app-store";
import { catalogVersions } from "@/store/selectors";
import type { QuestionCatalog } from "@/types/domain";

/** Hinweise zur Freigabe des Entwurfs (ohne Begründung, die fragt der Dialog ab) */
export function useReleaseBlockers(catalog: QuestionCatalog): string[] {
  const data = useAppStore((s) => s.data);
  return useMemo(() => {
    if (catalog.status !== "draft") return [];
    const base = data.catalogs.find((c) => c.id === catalog.supersedesCatalogId);
    return checkReleaseCatalog(catalog, base, data.requirements, undefined).blockers;
  }, [data.catalogs, data.requirements, catalog]);
}

/** Aktionen im Kopf der Katalogseite: je nach Version neue Version anlegen, Entwurf öffnen oder freigeben und verwerfen */
export function CatalogActions({ catalog }: { catalog: QuestionCatalog }) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const createDraft = useAppStore((s) => s.createCatalogDraft);
  const discard = useAppStore((s) => s.discardCatalogDraft);
  const release = useAppStore((s) => s.releaseCatalogVersion);
  const can = useCan();
  const permission = can("manage_catalog");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const releaseBlockers = useReleaseBlockers(catalog);
  const draft = catalogVersions(data, catalog).find((v) => v.status === "draft");

  if (catalog.status === "draft") {
    return (
      <>
        <GuardedButton variant="outline" onClick={() => setConfirmDiscard(true)} deniedReason={permission.allowed ? undefined : permission.reason}>
          <Trash2 aria-hidden /> Entwurf verwerfen
        </GuardedButton>
        <TransitionButton
          label="Version freigeben"
          run={(reason) => release(catalog.id, reason ?? "")}
          successMessage="Version freigegeben"
          blockers={releaseBlockers}
          deniedReason={permission.allowed ? undefined : permission.reason}
          reasonDialog={{
            title: `Version ${catalog.version} freigeben`,
            description: "Die bisherige Version wird außer Kraft gesetzt. Laufende und abgeschlossene Audits behalten ihre Checkliste.",
            fieldLabel: "Änderungsgrund",
            confirmLabel: "Version freigeben",
          }}
        />
        <ConfirmDialog
          open={confirmDiscard}
          onOpenChange={setConfirmDiscard}
          title="Entwurf verwerfen"
          description={`Alle Änderungen im Entwurf Version ${catalog.version} gehen verloren. Die freigegebene Version bleibt unverändert. Das Verwerfen steht im Verlauf.`}
          confirmLabel="Entwurf verwerfen"
          onConfirm={() => {
            const base = catalog.supersedesCatalogId;
            if (notify(discard(catalog.id), "Entwurf verworfen")) router.push(base ? `/kataloge/${base}` : "/kataloge");
          }}
        />
      </>
    );
  }

  // Nur die jeweils aktuelle freigegebene Version bietet eine neue Version an
  if (catalog.status === "released") {
    if (draft) {
      return (
        <Link href={`/kataloge/${draft.id}`} className={buttonVariants({ variant: "default" })}>
          Entwurf Version {draft.version} öffnen
        </Link>
      );
    }
    const guard = checkCreateCatalogDraft(catalog, data.catalogs);
    return (
      <GuardedButton
        blockers={guard.blockers}
        deniedReason={permission.allowed ? undefined : permission.reason}
        onClick={() => {
          const result = createDraft(catalog.id);
          if (notify(result, "Entwurf angelegt") && result.createdId) router.push(`/kataloge/${result.createdId}`);
        }}
      >
        <FilePlus2 aria-hidden /> Neue Version anlegen
      </GuardedButton>
    );
  }
  return null;
}
