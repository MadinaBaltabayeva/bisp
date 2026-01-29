import { describe, it } from "vitest";

describe("i18n routing config", () => {
  it.todo("should have uz, ru, en as supported locales");
  it.todo("should have uz as the default locale");
  it.todo("should use 'always' locale prefix strategy");
  it.todo("should configure NEXT_LOCALE cookie with 1-year maxAge");
  it.todo("should export routing object from defineRouting");
});

describe("locale matching", () => {
  it.todo("should match uz as a valid locale");
  it.todo("should match ru as a valid locale");
  it.todo("should match en as a valid locale");
  it.todo("should not match unsupported locale codes");
});
