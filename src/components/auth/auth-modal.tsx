"use client";

import { useState, useEffect } from "react";
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

const VIEW_CONFIG: Record<AuthView, { title: string; description: string }> = {
  login: {
    title: "Welcome back",
    description: "Log in to your RentHub account",
  },
  signup: {
    title: "Create your account",
    description: "Join RentHub to rent and list items in your community",
  },
  onboarding: {
    title: "Complete your profile",
    description: "Help your neighbors get to know you",
  },
};

export function AuthModal({
  open,
  onOpenChange,
  initialView = "login",
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialView);

  // Reset view when modal opens with a new initialView
  useEffect(() => {
    if (open) {
      setView(initialView);
    }
  }, [open, initialView]);

  const config = VIEW_CONFIG[view];

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
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
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
