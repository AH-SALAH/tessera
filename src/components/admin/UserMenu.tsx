// components/admin/UserMenu.tsx
"use client";

import { Dropdown } from "antd";
import { authClient } from "@/lib/auth-client";
import { IconAccount, IconChevronDown, IconSignOut } from "@/components/ui/icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  user: {
    email: string;
    role: string;
  };
  locale: string;
}

export function UserMenu({ user, locale }: UserMenuProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const initials = user.email.split("@")[0].slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await authClient.signOut();
    router.push(`/${locale}/sign-in`);
    router.refresh();
  }

  function handleMenuClick({ key }: { key: string }) {
    if (key === "signout") handleSignOut();
  }

  const menuItems = [
    {
      key: "signout",
      label: t("nav.signOut"),
      icon: <IconSignOut className="text-sm" />,
    },
  ];

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
      }}
      rootClassName="tessera-dropdown"
      trigger={["click"]}
      placement="bottomRight"
    >
      <button
        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
        aria-haspopup="true"
      >
        <span className="w-8 h-8 rounded-full bg-moss text-on-primary flex items-center justify-center text-xs font-medium">
          {initials}
        </span>
        <IconChevronDown className="text-xs text-on-surface-variant transition-transform duration-200" />
      </button>
    </Dropdown>
  );
}
