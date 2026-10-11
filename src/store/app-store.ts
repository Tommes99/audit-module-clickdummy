import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ActionStatus,
  AuditStatus,
  ChecklistRating,
  EffectivenessResult,
  FindingStatus,
  ID,
  ISODate,
  RoleKey,
  SeedData,
} from "@/types/domain";
import { freshSeed } from "@/data/seed";
import { demoPersonas, type Session } from "@/domain/permissions";
import type { ActionResult, CommandOutput } from "@/store/helpers";
import * as auditCmd from "@/store/commands/audit";
import * as checklistCmd from "@/store/commands/checklist";
import * as findingCmd from "@/store/commands/finding";
import * as capaCmd from "@/store/commands/capa";
import * as reportCmd from "@/store/commands/report";
import * as aiCmd from "@/store/commands/ai";
import * as catalogCmd from "@/store/commands/catalog";

export const STORE_KEY = "audit-clickdummy-v1";
/** Bei Versionswechsel wird auf den Seed zurückgesetzt, es gibt keine Migrationen */
export const STORE_VERSION = 1;

const defaultSession = (): Session => ({ ...demoPersonas[0] });

export interface AppState {
  data: SeedData;
  session: Session;
  /** Besuchte Schritte des Demo-Rundgangs (reiner UI-Fortschritt, kein fachliches Event) */
  tourDone: string[];

  setSession: (personId: ID, role: RoleKey) => void;
  setTourStep: (stepId: string, done: boolean) => void;
  resetToSeed: () => void;

  /** Neues Audit im Auditprogramm, Status Geplant */
  createAudit: (draft: auditCmd.AuditDraft) => ActionResult;
  transitionAudit: (id: ID, to: AuditStatus, reason?: string) => ActionResult;
  assignAuditor: (auditId: ID, personId: ID) => ActionResult;
  removeAuditor: (auditId: ID, personId: ID) => ActionResult;
  overrideWarning: (auditId: ID, warningKey: string, reason: string) => ActionResult;
  createChecklist: (auditId: ID, catalogId: ID) => ActionResult;

  rateItem: (itemId: ID, rating: ChecklistRating, notes?: string) => ActionResult;
  setItemNotes: (itemId: ID, notes: string) => ActionResult;
  /** Nur Demo-Abkürzung, wird als solche geloggt */
  markRemainingConform: (checklistId: ID) => ActionResult;
  attachEvidence: (target: checklistCmd.EvidenceTarget, draft: checklistCmd.EvidenceDraft) => ActionResult;

  createFinding: (draft: findingCmd.FindingDraft) => ActionResult;
  updateFinding: (id: ID, patch: findingCmd.FindingPatch) => ActionResult;
  transitionFinding: (id: ID, to: FindingStatus, reason?: string) => ActionResult;
  setRootCause: (findingId: ID, rca: findingCmd.RootCauseDraft, aiKey?: string) => ActionResult;
  linkFinding: (findingId: ID, links: { riskIds?: ID[]; kpiIds?: ID[] }, aiKey?: string) => ActionResult;

  createAction: (draft: capaCmd.ActionDraft) => ActionResult;
  transitionAction: (id: ID, to: ActionStatus, reason?: string) => ActionResult;
  planEffectivenessCheck: (findingId: ID, plannedDate: ISODate, method: string) => ActionResult;
  recordEffectivenessCheck: (id: ID, result: EffectivenessResult, comment: string) => ActionResult;
  /** Guard: andere Person als die Durchführende */
  approveEffectivenessCheck: (id: ID) => ActionResult;

  createReportDraft: (auditId: ID, fromAi: boolean) => ActionResult;
  updateReportDraft: (id: ID, patch: reportCmd.ReportPatch) => ActionResult;
  submitReport: (id: ID) => ActionResult;
  /** In Prüfung zurück in den Entwurf, Begründung Pflicht */
  returnReportToDraft: (id: ID, reason: string) => ActionResult;
  /** Setzt contentHash, danach transitionAudit(..., "released") */
  releaseReport: (id: ID) => ActionResult;
  createReportVersion: (id: ID, reason: string) => ActionResult;

  /** Fragenkataloge: Änderungen nur an Entwürfen, Freigabe setzt die Vorgängerversion außer Kraft */
  createCatalogDraft: (baseId: ID) => ActionResult;
  saveCatalogQuestion: (catalogId: ID, questionId: ID | null, input: catalogCmd.CatalogQuestionDraft) => ActionResult;
  removeCatalogQuestion: (catalogId: ID, questionId: ID) => ActionResult;
  moveCatalogQuestion: (catalogId: ID, questionId: ID, direction: -1 | 1) => ActionResult;
  discardCatalogDraft: (catalogId: ID) => ActionResult;
  releaseCatalogVersion: (catalogId: ID, reason: string) => ActionResult;

  acceptAiSuggestion: (key: string, target: aiCmd.AiTarget) => ActionResult;
  rejectAiSuggestion: (key: string, target: aiCmd.AiTarget) => ActionResult;
}

/** Auf dem Server gibt es keinen Browser-Speicher: dort ein leerer Ersatz */
const storage = createJSONStorage<Pick<AppState, "data" | "session" | "tourDone">>(() =>
  typeof window === "undefined"
    ? { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }
    : window.localStorage,
);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Muster jeder Action: Command (Guard, Update, appendEvent) ausführen, bei Erfolg übernehmen */
      const run =
        <A extends unknown[]>(cmd: (data: SeedData, session: Session, ...args: A) => CommandOutput) =>
        (...args: A): ActionResult => {
          const { data, session } = get();
          const out = cmd(data, session, ...args);
          if (out.result.ok) set({ data: out.data });
          return out.result;
        };

      return {
        data: freshSeed(),
        session: defaultSession(),
        tourDone: [],

        setSession: (personId, role) => set({ session: { personId, role } }),
        setTourStep: (stepId, done) =>
          set((s) => ({ tourDone: done ? [...new Set([...s.tourDone, stepId])] : s.tourDone.filter((d) => d !== stepId) })),
        // Setzt auch den Rundgang zurück
        resetToSeed: () => set({ data: freshSeed(), session: defaultSession(), tourDone: [] }),

        createAudit: run(auditCmd.createAudit),
        transitionAudit: run(auditCmd.transitionAudit),
        assignAuditor: run(auditCmd.assignAuditor),
        removeAuditor: run(auditCmd.removeAuditor),
        overrideWarning: run(auditCmd.overrideWarning),
        createChecklist: run(auditCmd.createChecklist),

        rateItem: run(checklistCmd.rateItem),
        setItemNotes: run(checklistCmd.setItemNotes),
        markRemainingConform: run(checklistCmd.markRemainingConform),
        attachEvidence: run(checklistCmd.attachEvidence),

        createFinding: run(findingCmd.createFinding),
        updateFinding: run(findingCmd.updateFinding),
        transitionFinding: run(findingCmd.transitionFinding),
        setRootCause: run(findingCmd.setRootCause),
        linkFinding: run(findingCmd.linkFinding),

        createAction: run(capaCmd.createAction),
        transitionAction: run(capaCmd.transitionAction),
        planEffectivenessCheck: run(capaCmd.planEffectivenessCheck),
        recordEffectivenessCheck: run(capaCmd.recordEffectivenessCheck),
        approveEffectivenessCheck: run(capaCmd.approveEffectivenessCheck),

        createReportDraft: run(reportCmd.createReportDraft),
        updateReportDraft: run(reportCmd.updateReportDraft),
        submitReport: run(reportCmd.submitReport),
        returnReportToDraft: run(reportCmd.returnReportToDraft),
        releaseReport: run(reportCmd.releaseReport),
        createReportVersion: run(reportCmd.createReportVersion),

        createCatalogDraft: run(catalogCmd.createCatalogDraft),
        saveCatalogQuestion: run(catalogCmd.saveCatalogQuestion),
        removeCatalogQuestion: run(catalogCmd.removeCatalogQuestion),
        moveCatalogQuestion: run(catalogCmd.moveCatalogQuestion),
        discardCatalogDraft: run(catalogCmd.discardCatalogDraft),
        releaseCatalogVersion: run(catalogCmd.releaseCatalogVersion),

        acceptAiSuggestion: run(aiCmd.acceptAiSuggestion),
        rejectAiSuggestion: run(aiCmd.rejectAiSuggestion),
      };
    },
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage,
      partialize: (s) => ({ data: s.data, session: s.session, tourDone: s.tourDone }),
      // Keine Migrationen: bei Versionswechsel zurück auf den Seed
      migrate: () => ({ data: freshSeed(), session: defaultSession(), tourDone: [] }),
    },
  ),
);
