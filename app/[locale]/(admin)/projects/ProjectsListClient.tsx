// app/[locale]/(admin)/projects/ProjectsListClient.tsx
"use client";

import { ContentTable, type ContentRow } from "@/components/admin/ContentTable";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { gql } from "graphql-tag";
import { apolloClient } from "@/lib/apollo/client";
import { App, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

interface DeleteProjectData {
  deleteProject: boolean;
}

interface ProjectsListClientProps {
  initialProjects: Array<{
    id: string;
    slug: string;
    titleEn: string | null;
    stack: string[];
    status: "DRAFT" | "PUBLISHED";
  }>;
  userRole: "ADMIN" | "EDITOR";
  locale: string;
}

export function ProjectsListClient({ initialProjects, userRole, locale }: ProjectsListClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [deleteProject] = useMutation<DeleteProjectData>(DELETE_PROJECT, { client: apolloClient });

  const [projects, setProjects] = useState(initialProjects);
  const [prevInitialProjects, setPrevInitialProjects] = useState(initialProjects);
  if (initialProjects !== prevInitialProjects) {
    setPrevInitialProjects(initialProjects);
    setProjects(initialProjects);
  }

  const rows: ContentRow[] = projects.map((p, index) => ({
    id: p.id,
    accessionNumber: `PRJ-${String(index + 1).padStart(3, "0")}`,
    slug: p.slug,
    title: p.titleEn ?? t("content.untitled"),
    metaLine: Array.isArray(p.stack) && p.stack.length > 0 ? p.stack.join(", ") : "—",
    status: p.status,
  }));

  function handleDeleteConfirm(id: string, title: string) {
    Modal.confirm({
      title: t("projects.deleteConfirm"),
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            {t("projects.deleteMessage")} <strong>{title}</strong>?
          </p>
          <p style={{ color: "#6B6F73", fontSize: 13 }}>{t("projects.deleteWarning")}</p>
        </div>
      ),
      okText: t("content.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      styles: {
        header: { borderBottom: "1px solid #D8D5CC", paddingBottom: 12 },
        body: { padding: "16px 24px" },
        footer: { borderTop: "1px solid #D8D5CC", paddingTop: 12 },
      },
      onOk: async () => {
        try {
          await deleteProject({ variables: { id } });
          setProjects((prev) => prev.filter((p) => p.id !== id));
          message.success(t("content.delete") + " " + t("content.successful"));
          router.refresh();
        } catch {
          message.error(t("projects.failedDelete"));
        }
      },
    });
  }

  return (
    <ContentTable
      rows={rows}
      onEdit={(id) => router.push(`/${locale}/projects/${id}`)}
      onDelete={(id) => {
        const project = projects.find((p) => p.id === id);
        handleDeleteConfirm(id, project?.titleEn ?? t("content.untitled"));
      }}
    />
  );
}
