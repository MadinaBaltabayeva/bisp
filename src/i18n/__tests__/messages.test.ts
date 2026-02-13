import { describe, it, expect } from "vitest";
import en from "../../../messages/en.json";
import uz from "../../../messages/uz.json";
import ru from "../../../messages/ru.json";

function getLeafKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("English translation file", () => {
  it("should have all required top-level namespaces", () => {
    const requiredNamespaces = [
      "Metadata",
      "Navigation",
      "BottomNav",
      "HomePage",
      "Auth",
      "Listings",
      "Browse",
      "Rentals",
      "Messages",
      "Profile",
      "Settings",
      "Admin",
      "Reviews",
      "Categories",
    ];
    for (const ns of requiredNamespaces) {
      expect(en).toHaveProperty(ns);
    }
  });

  it("should have no empty string values", () => {
    const leafKeys = getLeafKeys(en as Record<string, unknown>);
    for (const key of leafKeys) {
      const value = key.split(".").reduce(
        (obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>,
        en as Record<string, unknown>
      );
      expect(value, `Key "${key}" should not be empty`).not.toBe("");
    }
  });
});

describe("cross-locale key completeness", () => {
  it("should have matching keys between en.json and uz.json", () => {
    const enKeys = getLeafKeys(en as Record<string, unknown>).sort();
    const uzKeys = getLeafKeys(uz as Record<string, unknown>).sort();
    const missingInUz = enKeys.filter((k) => !uzKeys.includes(k));
    expect(missingInUz, `Missing in uz.json: ${missingInUz.join(", ")}`).toEqual([]);
  });

  it("should have matching keys between en.json and ru.json", () => {
    const enKeys = getLeafKeys(en as Record<string, unknown>).sort();
    const ruKeys = getLeafKeys(ru as Record<string, unknown>).sort();
    const missingInRu = enKeys.filter((k) => !ruKeys.includes(k));
    expect(missingInRu, `Missing in ru.json: ${missingInRu.join(", ")}`).toEqual([]);
  });

  it("should not have extra keys in uz.json not in en.json", () => {
    const enKeys = getLeafKeys(en as Record<string, unknown>).sort();
    const uzKeys = getLeafKeys(uz as Record<string, unknown>).sort();
    const extraInUz = uzKeys.filter((k) => !enKeys.includes(k));
    expect(extraInUz, `Extra in uz.json: ${extraInUz.join(", ")}`).toEqual([]);
  });

  it("should not have extra keys in ru.json not in en.json", () => {
    const enKeys = getLeafKeys(en as Record<string, unknown>).sort();
    const ruKeys = getLeafKeys(ru as Record<string, unknown>).sort();
    const extraInRu = ruKeys.filter((k) => !enKeys.includes(k));
    expect(extraInRu, `Extra in ru.json: ${extraInRu.join(", ")}`).toEqual([]);
  });
});
