import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroSection } from "../hero-section";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      kicker: "RentHub",
      title: "Rent what you need, nearby.",
      subtitle: "From drills to drum kits.",
      searchPlaceholder: "Search drills, speakers, tents…",
      browseItems: "Browse",
    };
    return map[key] ?? key;
  },
}));

const pushMock = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: pushMock }),
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

describe("HeroSection", () => {
  it("renders the quiet headline", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("heading", { level: 1, name: /rent what you need, nearby\./i }),
    ).toBeInTheDocument();
  });

  it("does not render the old trust-badge strip", () => {
    render(<HeroSection />);
    expect(screen.queryByText(/verified users/i)).toBeNull();
    expect(screen.queryByText(/active community/i)).toBeNull();
    expect(screen.queryByText(/top rated/i)).toBeNull();
  });

  it("does not use a gradient background class", () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector("section");
    expect(section?.className).not.toMatch(/bg-gradient/);
    expect(section?.className).not.toMatch(/from-amber/);
  });

  it("applies the serif utility to the h1", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.className).toMatch(/font-serif/);
  });

  it("submits search to /browse?q=... when user types and submits", async () => {
    pushMock.mockClear();
    render(<HeroSection />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "  power drill  " } });
    fireEvent.submit(input.closest("form")!);
    expect(pushMock).toHaveBeenCalledWith("/browse?q=power%20drill");
  });

  it("submits to /browse with no query when input is empty", () => {
    pushMock.mockClear();
    render(<HeroSection />);
    const form = screen.getByRole("search");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/browse");
  });
});
