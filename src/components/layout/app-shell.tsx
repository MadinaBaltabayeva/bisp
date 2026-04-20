"use client";

import { useState, useCallback } from "react";
import { TopNavbar } from "./top-navbar";
import { BottomTabBar } from "./bottom-tab-bar";
import { Footer } from "./footer";
import { AuthModal } from "@/components/auth/auth-modal";
import { AuthModalProvider } from "@/components/auth/auth-modal-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "signup">("login");

  const handleOpenAuthModal = useCallback((view: "login" | "signup" = "login") => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  }, []);

  return (
    <AuthModalProvider open={handleOpenAuthModal}>
      <div className="min-h-screen flex flex-col">
        <TopNavbar onOpenAuthModal={handleOpenAuthModal} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomTabBar />
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          initialView={authModalView}
        />
      </div>
    </AuthModalProvider>
  );
}
