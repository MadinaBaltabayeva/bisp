import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryGrid } from "../category-grid";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CategoryGrid", () => {
  it("renders 8 category links", () => {
    const { container } = render(<CategoryGrid />);
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(8);
  });

  it("links each tile to /browse with the correct category slug", () => {
    const { container } = render(<CategoryGrid />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/browse?category=tools");
    expect(hrefs).toContain("/browse?category=electronics");
    expect(hrefs).toContain("/browse?category=home-garden");
  });

  it("renders the section heading and subtitle", () => {
    render(<CategoryGrid />);
    expect(
      screen.getByRole("heading", { level: 2, name: /browse by category/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/find exactly what you/i)).toBeInTheDocument();
  });
});
