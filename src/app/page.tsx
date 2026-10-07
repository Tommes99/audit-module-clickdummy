"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TaskSectionList } from "@/components/home/task-section";
import { ProgrammeStatus } from "@/components/home/programme-status";
import { useAppStore } from "@/store/app-store";
import { tasksFor } from "@/store/selectors";
import { roleLabels } from "@/domain/labels";

export default function HomePage() {
  const data = useAppStore((s) => s.data);
  const session = useAppStore((s) => s.session);
  const sections = useMemo(() => tasksFor(data, session), [data, session]);
  const person = data.persons.find((p) => p.id === session.personId);
  const showStatus = session.role === "programme_manager" || session.role === "management";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Meine Aufgaben"
        help="home.tasks"
        subtitle={
          <>
            Guten Tag, <span className="font-medium text-foreground">{person?.name}</span>. Rolle: {roleLabels[session.role]}
          </>
        }
      />
      {showStatus && <ProgrammeStatus withDashboardLink={session.role === "management"} />}
      {sections.map((section) => (
        <TaskSectionList key={section.key} section={section} />
      ))}
    </div>
  );
}
