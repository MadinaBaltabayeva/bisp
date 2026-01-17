"use client";

import * as React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface PhotoCarouselProps {
  images: Array<{ id: string; url: string }>;
  title: string;
}

export function PhotoCarousel({ images, title }: PhotoCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // No images: show placeholder
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gray-100 lg:h-[500px] lg:aspect-auto">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <ImageIcon className="size-12" />
          <p className="text-sm">No photos</p>
        </div>
      </div>
    );
  }

  const singleImage = images.length === 1;

  return (
    <div className="relative">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={image.id}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 lg:h-[500px] lg:aspect-auto">
                <Image
                  src={image.url}
                  alt={`${title} - Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {!singleImage && (
          <>
            <CarouselPrevious className="left-3 bg-white/80 backdrop-blur-sm hover:bg-white" />
            <CarouselNext className="right-3 bg-white/80 backdrop-blur-sm hover:bg-white" />
          </>
        )}
      </Carousel>

      {/* Dot indicators */}
      {!singleImage && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "size-2 rounded-full transition-colors",
                index === current
                  ? "bg-primary"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
