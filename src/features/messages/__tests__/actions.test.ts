import { describe, it } from "vitest";

describe("message actions", () => {
  describe("createConversation", () => {
    it.todo(
      "createConversation: creates conversation tied to listing"
    ); // COMM-01
    it.todo(
      "createConversation: returns existing conversation if one exists"
    ); // COMM-01
  });

  describe("sendMessage", () => {
    it.todo("sendMessage: creates message in conversation"); // COMM-01
    it.todo("sendMessage: rejects message from non-participant"); // COMM-01
  });

  describe("queries", () => {
    it.todo("getConversations: returns conversations for user"); // COMM-02
    it.todo(
      "getMessages: returns messages in conversation ordered by date"
    ); // COMM-02
    it.todo("markMessagesRead: marks unread messages as read"); // COMM-02
    it.todo(
      "getUnreadCount: returns count of unread messages for user"
    ); // COMM-02
  });
});
