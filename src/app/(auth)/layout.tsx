import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/queries";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return <>{children}</>;
}
