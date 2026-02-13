import { describe, it, expect } from "vitest";
import { routing } from "../routing";

describe("i18n routing config", () => {
  it("should have uz, ru, en as supported locales", () => {
    expect(routing.locales).toEqual(["uz", "ru", "en"]);
  });

  it("should have uz as the default locale", () => {
    expect(routing.defaultLocale).toBe("uz");
  });

  it("should use 'always' locale prefix strategy", () => {
    expect(routing.localePrefix).toBe("always");
  });

  it("should configure NEXT_LOCALE cookie with 1-year maxAge", () => {
    expect(routing.localeCookie).toEqual(
      expect.objectContaining({
        name: "NEXT_LOCALE",
        maxAge: 60 * 60 * 24 * 365,
      })
    );
  });

  it("should export routing object from defineRouting", () => {
    expect(routing).toBeDefined();
    expect(routing.locales).toBeDefined();
    expect(routing.defaultLocale).toBeDefined();
  });
});

describe("locale matching", () => {
  it("should match uz as a valid locale", () => {
    expect(routing.locales).toContain("uz");
  });

  it("should match ru as a valid locale", () => {
    expect(routing.locales).toContain("ru");
  });

  it("should match en as a valid locale", () => {
    expect(routing.locales).toContain("en");
  });

  it("should not match unsupported locale codes", () => {
    expect(routing.locales).not.toContain("fr");
    expect(routing.locales).not.toContain("de");
    expect(routing.locales).not.toContain("zh");
  });
});
