import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/features/auth/queries";
import {
  getConversationById,
  getMessages,
} from "@/features/messages/queries";
import { ChatView } from "@/components/messages/chat-view";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const { conversationId } = await params;

  const [conversation, messages] = await Promise.all([
    getConversationById(conversationId, session.user.id),
    getMessages(conversationId, session.user.id),
  ]);

  if (!conversation || !messages) {
    notFound();
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-4xl flex-col">
      {/* Back button (mainly for mobile) */}
      <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/messages">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium">Back to messages</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatView
          conversationId={conversation.id}
          currentUser={{
            id: session.user.id,
            name: session.user.name,
            image: session.user.image ?? null,
          }}
          otherUser={conversation.otherUser}
          listing={conversation.listing}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
