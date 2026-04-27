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
  it("renders the headline", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/Rent/);
    expect(h1.textContent).toMatch(/Anything/);
    expect(h1.textContent).toMatch(/Anytime/);
  });

  it("shows the trust badges and CTAs", () => {
    render(<HeroSection />);
    expect(screen.getByText(/10K\+ Users/)).toBeInTheDocument();
    expect(screen.getByText(/50K\+/)).toBeInTheDocument();
    expect(screen.getByText(/Verified Users/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /browse items/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /list your items/i })).toBeInTheDocument();
  });

  it("submits search to /browse?q=... when user types and submits", () => {
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

  it("Browse Items button navigates to /browse", () => {
    pushMock.mockClear();
    render(<HeroSection />);
    fireEvent.click(screen.getByRole("button", { name: /browse items/i }));
    expect(pushMock).toHaveBeenCalledWith("/browse");
  });

  it("List Your Items button navigates to new listing", () => {
    pushMock.mockClear();
    render(<HeroSection />);
    fireEvent.click(screen.getByRole("button", { name: /list your items/i }));
    expect(pushMock).toHaveBeenCalledWith("/listings/new");
  });
});
