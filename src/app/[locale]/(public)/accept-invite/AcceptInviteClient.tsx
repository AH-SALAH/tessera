// app/[locale]/(public)/accept-invite/AcceptInviteClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Alert, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FiUserPlus } from "react-icons/fi";
import { buildAntdThemeConfig } from "@/lib/theme/antd-theme";
import { gql } from "graphql-tag";
import { useMutation } from "@apollo/client/react";
import { apolloClient } from "@/lib/apollo/client";

const ACCEPT_INVITE = gql`
  mutation AcceptInvite($token: String!, $name: String!, $password: String!) {
    acceptInvite(token: $token, name: $name, password: $password)
  }
`;

interface AcceptInviteClientProps {
  token?: string;
}

export function AcceptInviteClient({ token }: AcceptInviteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptInvite] = useMutation<{ acceptInvite: boolean }>(ACCEPT_INVITE, {
    client: apolloClient,
  });

  const inviteToken = token || searchParams.get("token");
  const locale = searchParams.get("locale") || "en";

  async function onFinish(values: { name: string; password: string }) {
    if (!inviteToken) {
      setError(t("acceptInvite.invalidLink"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await acceptInvite({
        variables: {
          token: inviteToken,
          name: values.name,
          password: values.password,
        },
      });

      if (data?.acceptInvite) {
        router.push(`/${locale}/sign-in?accepted=true`);
      } else {
        setError(t("acceptInvite.failed"));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("acceptInvite.failed");
      if (message.includes("INVITE_EXPIRED")) {
        setError(t("acceptInvite.expired"));
      } else if (message.includes("INVITE_NOT_FOUND")) {
        setError(t("acceptInvite.invalidLink"));
      } else if (message.includes("USER_EXISTS")) {
        setError(t("acceptInvite.alreadyRegistered"));
      } else {
        setError(t("acceptInvite.failed"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!inviteToken) {
    return (
      <div className="login-container">
        <ConfigProvider theme={buildAntdThemeConfig("light")}>
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo flex justify-center">
                <Image
                  src="/assets/logo.png"
                  alt="Tessera"
                  width={180}
                  height={60}
                  priority
                  className="h-10 w-auto"
                />
              </div>
              <p className="login-tagline">{t("acceptInvite.tagline")}</p>
            </div>
            <Alert title={t("acceptInvite.invalidLink")} type="error" showIcon />
          </div>
        </ConfigProvider>
      </div>
    );
  }

  return (
    <div className="login-container">
      <ConfigProvider theme={buildAntdThemeConfig("light")}>
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo flex justify-center">
              <Image
                src="/assets/logo.png"
                alt="Tessera"
                width={180}
                height={60}
                priority
                className="h-10 w-auto"
              />
            </div>
            <p className="login-tagline">{t("acceptInvite.tagline")}</p>
          </div>

          {error && <Alert title={error} type="error" className="mb-4" showIcon />}

          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              name="name"
              label={
                <span className="font-mono text-xs uppercase tracking-wide text-muted">
                  {t("acceptInvite.nameLabel")}
                </span>
              }
              rules={[{ required: true, message: t("acceptInvite.nameRequired") }]}
            >
              <Input placeholder="Jane Doe" autoComplete="name" />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="font-mono text-xs uppercase tracking-wide text-muted">
                  {t("acceptInvite.passwordLabel")}
                </span>
              }
              rules={[
                { required: true, message: t("acceptInvite.passwordRequired") },
                { min: 8, message: t("acceptInvite.passwordMin") },
              ]}
            >
              <Input.Password type="password" placeholder="••••••••" autoComplete="new-password" />
            </Form.Item>

            <Form.Item className="mt-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<FiUserPlus />}
              >
                {t("acceptInvite.submit")}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </ConfigProvider>
    </div>
  );
}
