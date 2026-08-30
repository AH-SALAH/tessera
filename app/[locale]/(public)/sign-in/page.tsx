// app/[locale]/(public)/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Alert, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FiLogIn } from "react-icons/fi";
import { buildAntdThemeConfig } from "@/lib/theme/antd-theme";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/en/projects";

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t("signin.invalidCredentials"));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t("signin.error"));
    } finally {
      setLoading(false);
    }
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
            <p className="login-tagline">{t("signin.tagline")}</p>
          </div>

          {error && <Alert title={error} type="error" className="mb-4" showIcon />}

          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              name="email"
              label={
                <span className="font-mono text-xs uppercase tracking-wide text-muted">
                  {t("signin.emailLabel")}
                </span>
              }
              rules={[
                { required: true, message: t("signin.emailRequired") },
                { type: "email", message: t("signin.invalidEmail") },
              ]}
            >
              <Input type="email" placeholder="you@example.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="font-mono text-xs uppercase tracking-wide text-muted">
                  {t("signin.passwordLabel")}
                </span>
              }
              rules={[{ required: true, message: t("signin.passwordRequired") }]}
            >
              <Input.Password
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mt-6">
              <Button type="primary" htmlType="submit" loading={loading} block icon={<FiLogIn />}>
                {t("signin.title")}
              </Button>
            </Form.Item>
          </Form>

          <p
            className="text-center mt-4 text-sm text-muted"
          >
            {t("signin.noRegistration")}
          </p>
        </div>
      </ConfigProvider>
    </div>
  );
}
