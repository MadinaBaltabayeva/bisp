import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RentHub - Rent Anything From Your Neighbors",
  description:
    "A peer-to-peer rental marketplace where anyone can list items for rent or browse and rent items from others.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
