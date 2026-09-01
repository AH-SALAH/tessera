// app/[locale]/(admin)/users/UsersListClient.tsx
"use client";

import { App, Table, Button, Modal, Form, Input, Select, Tooltip, Tag } from "antd";
import { IconEdit, IconDelete } from "@/components/ui/icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "graphql-tag";
import { apolloClient } from "@/lib/apollo/client";
import { useState } from "react";

const INVITE_USER = gql`
  mutation InviteUser($email: String!, $role: Role!) {
    inviteUser(email: $email, role: $role) {
      id
      email
      role
      expiresAt
    }
  }
`;

const PENDING_INVITATIONS = gql`
  query PendingInvitations {
    pendingInvitations {
      id
      email
      role
      expiresAt
      createdAt
    }
  }
`;

const RESEND_INVITE = gql`
  mutation ResendInvite($invitationId: ID!) {
    resendInvite(invitationId: $invitationId) {
      id
      expiresAt
    }
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $role: Role!) {
    updateUserRole(id: $id, role: $role) {
      id
      role
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

interface Invitation {
  id: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  expiresAt: string;
  createdAt: string;
}

interface InviteUserData {
  inviteUser: Invitation;
}

interface PendingInvitationsData {
  pendingInvitations: Invitation[];
}

interface ResendInviteData {
  resendInvite: { id: string; expiresAt: string };
}

interface UpdateUserRoleData {
  updateUserRole: { id: string; role: "ADMIN" | "EDITOR" };
}

interface DeleteUserData {
  deleteUser: boolean;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "EDITOR";
  locale: string;
  theme: string;
  createdAt: string;
}

interface UsersListClientProps {
  initialUsers: UserRow[];
  locale: string;
}

export function UsersListClient({ initialUsers, locale }: UsersListClientProps) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [inviteUser] = useMutation<InviteUserData>(INVITE_USER, { client: apolloClient });
  const [resendInvite] = useMutation<ResendInviteData>(RESEND_INVITE, { client: apolloClient });
  const [updateUserRole] = useMutation<UpdateUserRoleData>(UPDATE_USER_ROLE, {
    client: apolloClient,
  });
  const [deleteUser] = useMutation<DeleteUserData>(DELETE_USER, { client: apolloClient });

  const { data: invitationsData, refetch: refetchInvitations } = useQuery<PendingInvitationsData>(
    PENDING_INVITATIONS,
    { client: apolloClient },
  );

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [inviteForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [users, setUsers] = useState(initialUsers);
  const [prevInitialUsers, setPrevInitialUsers] = useState(initialUsers);
  if (initialUsers !== prevInitialUsers) {
    setPrevInitialUsers(initialUsers);
    setUsers(initialUsers);
  }

  const pendingInvitations = invitationsData?.pendingInvitations ?? [];

  const columns = [
    { title: t("users.email"), dataIndex: "email", key: "email", ellipsis: true },
    {
      title: t("users.name"),
      dataIndex: "name",
      key: "name",
      responsive: ["md"] as ("md" | "lg" | "xxxl" | "xxl" | "xl" | "sm" | "xs")[],
      render: (v: string | null) => v ?? "—",
    },
    {
      title: t("users.role"),
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-base border px-2 py-0.5 font-mono text-xs ${
            role === "ADMIN" ? "border-moss text-moss" : "border-ochre text-ochre"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${role === "ADMIN" ? "bg-moss" : "bg-ochre"}`}
          />
          {role}
        </span>
      ),
    },
    {
      title: t("content.created"),
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg"] as ("md" | "lg" | "xxxl" | "xxl" | "xl" | "sm" | "xs")[],
      width: 120,
      render: (v: string) => {
        return v ? new Date(v).toLocaleDateString() : "-";
      },
    },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_: unknown, record: UserRow) => (
        <div className="flex gap-2 justify-end">
          <Tooltip title={`${t("content.edit")} ${record.email}`}>
            <Button
              size="small"
              onClick={() => handleEditOpen(record)}
              icon={<IconEdit />}
              aria-label={`${t("content.edit")} ${record.email}`}
            />
          </Tooltip>
          <Tooltip title={`${t("content.delete")} ${record.email}`}>
            <Button
              size="small"
              danger
              onClick={() => handleDeleteConfirm(record)}
              icon={<IconDelete />}
              aria-label={`${t("content.delete")} ${record.email}`}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const invitationColumns = [
    { title: t("users.email"), dataIndex: "email", key: "email", ellipsis: true },
    {
      title: t("users.role"),
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-base border px-2 py-0.5 font-mono text-xs ${
            role === "ADMIN" ? "border-moss text-moss" : "border-ochre text-ochre"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${role === "ADMIN" ? "bg-moss" : "bg-ochre"}`}
          />
          {role}
        </span>
      ),
    },
    {
      title: t("users.status"),
      key: "status",
      width: 100,
      render: () => <Tag color="warning">{t("users.pending")}</Tag>,
    },
    {
      title: t("content.created"),
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg"] as ("md" | "lg" | "xxxl" | "xxl" | "xl" | "sm" | "xs")[],
      width: 120,
      render: (v: string) => {
        return v ? new Date(v).toLocaleDateString() : "-";
      },
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: unknown, record: Invitation) => (
        <div className="flex gap-2 justify-end">
          <Tooltip title={t("users.resendInvite")}>
            <Button
              size="small"
              onClick={() => handleResendInvite(record.id)}
              aria-label={t("users.resendInvite")}
            >
              ↻
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  async function handleInvite(values: { email: string; role: "ADMIN" | "EDITOR" }) {
    setInviteLoading(true);
    try {
      await inviteUser({ variables: { email: values.email, role: values.role } });
      refetchInvitations();
      message.success(t("users.invited"));
      setInviteModalOpen(false);
      inviteForm.resetFields();
    } catch {
      message.error(t("users.failedInvite"));
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleResendInvite(invitationId: string) {
    try {
      await resendInvite({ variables: { invitationId } });
      refetchInvitations();
      message.success(t("users.inviteResent"));
    } catch {
      message.error(t("users.failedResend"));
    }
  }

  function handleEditOpen(user: UserRow) {
    setEditingUser(user);
    editForm.setFieldsValue({ role: user.role });
    setEditModalOpen(true);
  }

  async function handleEditSubmit(values: { role: "ADMIN" | "EDITOR" }) {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const { data } = await updateUserRole({
        variables: { id: editingUser.id, role: values.role },
      });
      if (data?.updateUserRole) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, role: data.updateUserRole.role } : u)),
        );
      }
      message.success(t("users.roleUpdated"));
      setEditModalOpen(false);
      setEditingUser(null);
      editForm.resetFields();
    } catch {
      message.error(t("users.failedRole"));
    } finally {
      setEditLoading(false);
    }
  }

  function handleDeleteConfirm(user: UserRow) {
    modal.confirm({
      title: t("content.delete"),
      content: (
        <div className="px-6 py-4">
          <p style={{ marginBottom: 8 }}>
            {t("users.deleteConfirm")} <strong>{user.email}</strong>?
          </p>
          <p className="text-muted text-xs">{t("users.deleteWarning")}</p>
        </div>
      ),
      okText: t("content.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      styles: {
        header: { borderBottom: "1px solid var(--color-clay-line)", paddingBottom: 12 },
        footer: { borderTop: "1px solid var(--color-clay-line)", paddingTop: 12 },
      },
      onOk: async () => {
        try {
          await deleteUser({ variables: { id: user.id } });
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          message.success(t("users.deleted"));
        } catch {
          message.error(t("users.failedDelete"));
        }
      },
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="primary" onClick={() => setInviteModalOpen(true)}>
          {t("content.addNew")}
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg text-graphite mb-3">
            {t("users.pendingInvitations")}
          </h2>
          <div className="overflow-x-auto">
            <Table
              rowKey="id"
              dataSource={pendingInvitations}
              columns={invitationColumns}
              pagination={false}
              scroll={{ x: 600 }}
              size="small"
            />
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="overflow-x-auto">
        <Table
          rowKey="id"
          dataSource={users}
          columns={columns}
          pagination={{ pageSize: 20, showSizeChanger: false, size: "small" }}
          scroll={{ x: 600 }}
          size="small"
        />
      </div>

      {/* Invite Modal */}
      <Modal
        title={t("users.invite")}
        open={inviteModalOpen}
        confirmLoading={inviteLoading}
        onOk={() =>
          inviteForm
            .validateFields()
            .then(handleInvite)
            .catch(() => {})
        }
        onCancel={() => {
          setInviteModalOpen(false);
          inviteForm.resetFields();
        }}
        styles={{
          header: { borderBottom: "1px solid var(--color-clay-line)", paddingBottom: 12 },
          footer: { borderTop: "1px solid var(--color-clay-line)", paddingTop: 12 },
        }}
      >
        <Form form={inviteForm} layout="vertical">
          <Form.Item
            name="email"
            label={t("users.email")}
            rules={[
              { required: true, message: t("users.emailRequired") },
              { type: "email", message: t("users.invalidEmail") },
            ]}
          >
            <Input
              placeholder="newuser@example.com"
              className="!placeholder-[var(--color-graphit)]"
            />
          </Form.Item>
          <Form.Item name="role" label={t("users.role")} rules={[{ required: true }]}>
            <Select
              placeholder={t("users.selectRole")}
              className="!placeholder-[var(--color-graphit)]"
            >
              <Select.Option value="EDITOR">EDITOR</Select.Option>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
            </Select>
          </Form.Item>
        </Form>
        <p className="text-muted text-xs" style={{ marginTop: -8 }}>{t("users.inviteHint")}</p>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title={t("users.editRole")}
        open={editModalOpen}
        confirmLoading={editLoading}
        onOk={() =>
          editForm
            .validateFields()
            .then(handleEditSubmit)
            .catch(() => {})
        }
        onCancel={() => {
          setEditModalOpen(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        styles={{
          header: { borderBottom: "1px solid var(--color-clay-line)", paddingBottom: 12 },
          footer: { borderTop: "1px solid var(--color-clay-line)", paddingTop: 12 },
        }}
      >
        {editingUser && (
          <div className="mb-4 rounded-base p-3">
            <div
              className="font-mono text-xs text-graphite"
            >
              {editingUser.email}
            </div>
          </div>
        )}
        <Form form={editForm} layout="vertical">
          <Form.Item name="role" label={t("users.role")} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="EDITOR">EDITOR</Select.Option>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
