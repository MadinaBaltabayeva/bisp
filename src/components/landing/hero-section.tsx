import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      {/* Decorative background circles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white" />
        <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-white" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Rent anything from{" "}
            <span className="text-primary-200">your neighbors</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100 sm:text-xl">
            Why buy when you can borrow? Find tools, electronics, sports gear, and more
            from people in your community. Save money, reduce waste, build connections.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg"
            >
              <Link href="/#categories">
                <Search className="size-5" />
                Browse Items
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/listings/new">
                <PlusCircle className="size-5" />
                List Your Item
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
