import { HeroSection } from "@/components/landing/hero-section";
import { CategoryGrid } from "@/components/landing/category-grid";
import { ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />

      {/* Popular Items placeholder */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Popular Items
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-16 text-gray-400">
            <ShoppingBag className="size-10" />
            <p className="text-sm">Popular items coming soon</p>
          </div>
        </div>
      </section>
    </>
  );
}
