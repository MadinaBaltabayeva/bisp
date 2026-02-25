"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { updateEmailPreference } from "@/features/notifications/actions";

interface EmailToggleProps {
  defaultEnabled: boolean;
}

export function EmailToggle({ defaultEnabled }: EmailToggleProps) {
  const t = useTranslations("Settings");
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    // Optimistic update
    setEnabled(checked);

    startTransition(async () => {
      const result = await updateEmailPreference(checked);
      if (result?.error) {
        // Revert on error
        setEnabled(!checked);
      }
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label
          htmlFor="email-notifications"
          className="text-sm font-medium text-gray-900"
        >
          {t("emailNotifications")}
        </label>
        <p className="text-sm text-muted-foreground">
          {t("emailNotificationsDescription")}
        </p>
      </div>
      <Switch
        id="email-notifications"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}
