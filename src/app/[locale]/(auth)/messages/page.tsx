import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/queries";
import { getConversations } from "@/features/messages/queries";
import { MessagesLayout } from "./messages-layout";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const conversations = await getConversations(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold">Messages</h1>
      <MessagesLayout
        conversations={conversations}
        currentUserId={session.user.id}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          image: session.user.image ?? null,
        }}
      />
    </div>
  );
}
