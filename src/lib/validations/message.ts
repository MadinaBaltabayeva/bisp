import { z } from "zod";

export const messageSchema = z.object({
  conversationId: z.string().min(1, "Conversation is required"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
});

export type MessageInput = z.input<typeof messageSchema>;
export type MessageValues = z.infer<typeof messageSchema>;
