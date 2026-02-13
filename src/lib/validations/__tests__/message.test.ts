import { describe, it, expect } from "vitest";
import { messageSchema } from "../message";

describe("message validations", () => {
  describe("messageSchema", () => {
    it("accepts valid message", () => {
      const result = messageSchema.safeParse({
        conversationId: "conv_1",
        content: "Hello!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty content", () => {
      const result = messageSchema.safeParse({
        conversationId: "conv_1",
        content: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects content longer than 2000 characters", () => {
      const result = messageSchema.safeParse({
        conversationId: "conv_1",
        content: "A".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("requires conversationId", () => {
      const result = messageSchema.safeParse({
        content: "Hello!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty conversationId", () => {
      const result = messageSchema.safeParse({
        conversationId: "",
        content: "Hello!",
      });
      expect(result.success).toBe(false);
    });
  });
});
