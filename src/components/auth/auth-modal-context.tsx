"use client";

import { createContext, useContext } from "react";

type AuthModalView = "login" | "signup";

interface AuthModalContextValue {
  open: (view?: AuthModalView) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({
  open,
  children,
}: {
  open: (view?: AuthModalView) => void;
  children: React.ReactNode;
}) {
  return (
    <AuthModalContext.Provider value={{ open }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
