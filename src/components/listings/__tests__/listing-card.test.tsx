import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingCard } from "../listing-card";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      perDay: "/day",
      perHour: "/hour",
      perWeek: "/week",
      perMonth: "/month",
      contactForPrice: "Contact for price",
      noPhoto: "No photo",
      aiVerified: "AI verified",
      unavailable: "Unavailable",
    };
    return map[key] ?? key;
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

vi.mock("@/components/favorites/favorite-button", () => ({
  FavoriteButton: () => <button aria-label="Toggle favorite" />,
}));

vi.mock("@/components/profile/verification-badge", () => ({
  VerificationBadgeIcon: () => <span data-testid="verification-badge" />,
}));

vi.mock("@/components/profile/reputation-badge", () => ({
  ReputationBadgeIcon: () => <span data-testid="reputation-badge" />,
}));

vi.mock("@/components/listings/availability-toggle", () => ({
  AvailabilityToggle: () => <button aria-label="Toggle availability" />,
}));

const baseListing = {
  id: "abc",
  title: "Power drill",
  priceDaily: 12,
  priceHourly: null,
  priceWeekly: null,
  priceMonthly: null,
  location: "Brooklyn",
  aiVerified: false,
  images: [{ id: "i1", url: "https://example.com/x.jpg", isCover: true }],
  category: { id: "c1", name: "Tools", slug: "tools" },
  owner: { idVerified: false },
};

describe("ListingCard", () => {
  it("renders title, price, and location", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("Power drill")).toBeInTheDocument();
    expect(screen.getByText("$12/day")).toBeInTheDocument();
    expect(screen.getByText("Brooklyn")).toBeInTheDocument();
  });

  it("does not render a category pill", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.queryByText("Tools")).toBeNull();
  });

  it("has no heavy card frame classes on the outer wrapper", () => {
    const { container } = render(<ListingCard listing={baseListing} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).not.toMatch(/rounded-2xl/);
    expect(outer.className).not.toMatch(/shadow-warm-sm/);
    expect(outer.className).not.toMatch(/bg-white/);
  });

  it("does not overlay a white price pill on the image", () => {
    const { container } = render(<ListingCard listing={baseListing} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/bg-white\/95/);
    expect(html).not.toMatch(/backdrop-blur-sm/);
  });
});
