export const CATEGORIES = [
  {
    name: "Tools",
    slug: "tools",
    icon: "wrench",
    description: "Power tools, hand tools, and workshop equipment",
    sortOrder: 1,
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "laptop",
    description: "Cameras, drones, projectors, and gadgets",
    sortOrder: 2,
  },
  {
    name: "Sports",
    slug: "sports",
    icon: "dumbbell",
    description: "Sports gear, fitness equipment, and accessories",
    sortOrder: 3,
  },
  {
    name: "Outdoor",
    slug: "outdoor",
    icon: "tent",
    description: "Camping gear, hiking equipment, and outdoor furniture",
    sortOrder: 4,
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "car",
    description: "Cars, bikes, scooters, and boats",
    sortOrder: 5,
  },
  {
    name: "Clothing",
    slug: "clothing",
    icon: "shirt",
    description: "Formal wear, costumes, and specialty clothing",
    sortOrder: 6,
  },
  {
    name: "Music",
    slug: "music",
    icon: "music",
    description: "Instruments, speakers, and audio equipment",
    sortOrder: 7,
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    icon: "home",
    description: "Furniture, appliances, and garden tools",
    sortOrder: 8,
  },
] as const;

export type Category = (typeof CATEGORIES)[number];
