"use client";

// Stub: replaced in Task 2 with full auth modal flow
interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: "login" | "signup";
}

export function AuthModal({ open, onOpenChange, initialView }: AuthModalProps) {
  if (!open) return null;
  return null;
}
