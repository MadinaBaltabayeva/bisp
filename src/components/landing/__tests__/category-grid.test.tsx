import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryGrid } from "../category-grid";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => {
    if (ns === "HomePage.categories" && key === "title") return "Browse by category";
    if (ns === "HomePage.categories" && key === "meta") return "8 categories";
    return key;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img {...props} />
  ),
}));

describe("CategoryGrid", () => {
  it("renders 8 tiles with images", () => {
    const { container } = render(<CategoryGrid />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(8);
  });

  it("does not use per-tile gradient classes", () => {
    const { container } = render(<CategoryGrid />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/from-orange-500/);
    expect(html).not.toMatch(/to-amber-600/);
    expect(html).not.toMatch(/from-pink-500/);
    expect(html).not.toMatch(/bg-gradient-to-br/);
  });

  it("renders the serif section heading", () => {
    render(<CategoryGrid />);
    const h2 = screen.getByRole("heading", { level: 2, name: /browse by category/i });
    expect(h2.className).toMatch(/font-serif/);
  });
});
