"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { OnboardingWizard } from "./onboarding-wizard";

type AuthView = "login" | "signup" | "onboarding";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: "login" | "signup";
}

export function AuthModal({
  open,
  onOpenChange,
  initialView = "login",
}: AuthModalProps) {
  const t = useTranslations("Auth");
  const [view, setView] = useState<AuthView>(initialView);

  // Reset view when modal opens with a new initialView
  useEffect(() => {
    if (open) {
      setView(initialView);
    }
  }, [open, initialView]);

  function getTitle() {
    switch (view) {
      case "login":
        return t("login.title");
      case "signup":
        return t("signup.title");
      case "onboarding":
        return t("onboarding.title");
    }
  }

  function getDescription() {
    switch (view) {
      case "login":
        return t("login.description");
      case "signup":
        return t("signup.description");
      case "onboarding":
        return t("onboarding.description");
    }
  }

  // Prevent dismissing during onboarding (user should complete it)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && view === "onboarding") {
      // Allow closing but the profile will have incomplete data
      // This is acceptable per the plan -- "their profile will have empty location but it should still work"
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {view === "login" && (
          <LoginForm
            onSwitchToSignup={() => setView("signup")}
            onSuccess={() => onOpenChange(false)}
          />
        )}

        {view === "signup" && (
          <SignupForm
            onSwitchToLogin={() => setView("login")}
            onSuccess={() => setView("onboarding")}
          />
        )}

        {view === "onboarding" && (
          <OnboardingWizard
            onComplete={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
