import { Link } from "@/i18n/navigation";
import {
  Wrench,
  Laptop,
  Dumbbell,
  Tent,
  Car,
  Shirt,
  Music,
  Home,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/features/seed/categories";
import { Card, CardContent } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  wrench: Wrench,
  laptop: Laptop,
  dumbbell: Dumbbell,
  tent: Tent,
  car: Car,
  shirt: Shirt,
  music: Music,
  home: Home,
};

export function CategoryGrid() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Browse by Category
        </h2>
        <p className="mt-2 text-gray-600">
          Find what you need from our growing community
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const IconComponent = ICON_MAP[category.icon] || Home;

          return (
            <Link key={category.slug} href={`/browse?category=${category.slug}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5">
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary-50">
                    <IconComponent className="size-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
