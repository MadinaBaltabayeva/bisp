export interface SeedListing {
  title: string;
  description: string;
  condition: string;
  priceHourly: number | null;
  priceDaily: number | null;
  priceWeekly: number | null;
  priceMonthly: number | null;
  location: string;
  region: string;
  latitude: number;
  longitude: number;
  categorySlug: string;
  ownerEmail: string;
  imageUrls: string[];
}

export const SEED_LISTINGS: SeedListing[] = [
  // === Sarah Chen - San Francisco, CA (Tools) ===
  {
    title: "DeWalt Power Drill Kit",
    description:
      "Complete 20V MAX cordless drill/driver kit with two batteries, charger, and carrying case. Perfect for home improvement projects, furniture assembly, and general drilling tasks.",
    condition: "good",
    priceHourly: 5,
    priceDaily: 15,
    priceWeekly: 60,
    priceMonthly: null,
    location: "San Francisco, CA",
    region: "West",
    latitude: 37.7749,
    longitude: -122.4194,
    categorySlug: "tools",
    ownerEmail: "sarah.chen@example.com",
    imageUrls: [
      "https://picsum.photos/seed/drill1/800/600",
      "https://picsum.photos/seed/drill2/800/600",
      "https://picsum.photos/seed/drill3/800/600",
    ],
  },
  {
    title: "Pressure Washer 3000 PSI",
    description:
      "Gas-powered pressure washer with 3000 PSI output. Includes multiple nozzle tips for different cleaning tasks. Great for decks, driveways, siding, and vehicles.",
    condition: "like_new",
    priceHourly: 15,
    priceDaily: 45,
    priceWeekly: 175,
    priceMonthly: null,
    location: "San Francisco, CA",
    region: "West",
    latitude: 37.7749,
    longitude: -122.4194,
    categorySlug: "tools",
    ownerEmail: "sarah.chen@example.com",
    imageUrls: [
      "https://picsum.photos/seed/washer1/800/600",
      "https://picsum.photos/seed/washer2/800/600",
    ],
  },
  {
    title: "Circular Saw with Guide Rail",
    description:
      "Makita 7-1/4 inch circular saw with 55-inch guide rail for precise straight cuts. Ideal for woodworking, trim work, and sheet goods cutting.",
    condition: "good",
    priceHourly: null,
    priceDaily: 25,
    priceWeekly: 100,
    priceMonthly: null,
    location: "San Francisco, CA",
    region: "West",
    latitude: 37.7749,
    longitude: -122.4194,
    categorySlug: "tools",
    ownerEmail: "sarah.chen@example.com",
    imageUrls: [
      "https://picsum.photos/seed/circsaw1/800/600",
      "https://picsum.photos/seed/circsaw2/800/600",
      "https://picsum.photos/seed/circsaw3/800/600",
    ],
  },

  // === Marcus Johnson - Austin, TX (Electronics) ===
  {
    title: "Sony A7III Camera Kit",
    description:
      "Full-frame mirrorless camera body with 28-70mm kit lens, extra battery, 64GB SD card, and camera bag. Perfect for photography shoots, events, and content creation.",
    condition: "like_new",
    priceHourly: 20,
    priceDaily: 75,
    priceWeekly: 350,
    priceMonthly: 1200,
    location: "Austin, TX",
    region: "South",
    latitude: 30.2672,
    longitude: -97.7431,
    categorySlug: "electronics",
    ownerEmail: "marcus.johnson@example.com",
    imageUrls: [
      "https://picsum.photos/seed/sonya7-1/800/600",
      "https://picsum.photos/seed/sonya7-2/800/600",
      "https://picsum.photos/seed/sonya7-3/800/600",
      "https://picsum.photos/seed/sonya7-4/800/600",
    ],
  },
  {
    title: "DJI Mavic 3 Drone",
    description:
      "Professional drone with Hasselblad camera, 46-minute flight time, and omnidirectional obstacle sensing. Comes with three batteries and a charging hub. FAA registration required.",
    condition: "new",
    priceHourly: 30,
    priceDaily: 120,
    priceWeekly: 500,
    priceMonthly: null,
    location: "Austin, TX",
    region: "South",
    latitude: 30.2672,
    longitude: -97.7431,
    categorySlug: "electronics",
    ownerEmail: "marcus.johnson@example.com",
    imageUrls: [
      "https://picsum.photos/seed/mavic1/800/600",
      "https://picsum.photos/seed/mavic2/800/600",
      "https://picsum.photos/seed/mavic3/800/600",
    ],
  },
  {
    title: "4K Projector with Screen",
    description:
      "Epson 4K Pro projector with 100-inch pull-up screen and HDMI cables. Ideal for movie nights, presentations, outdoor screenings, and gaming events.",
    condition: "good",
    priceHourly: null,
    priceDaily: 50,
    priceWeekly: 200,
    priceMonthly: null,
    location: "Austin, TX",
    region: "South",
    latitude: 30.2672,
    longitude: -97.7431,
    categorySlug: "electronics",
    ownerEmail: "marcus.johnson@example.com",
    imageUrls: [
      "https://picsum.photos/seed/projector1/800/600",
      "https://picsum.photos/seed/projector2/800/600",
    ],
  },

  // === Elena Rodriguez - Denver, CO (Outdoor) ===
  {
    title: "4-Person Backpacking Tent",
    description:
      "REI Co-op Half Dome 4-person tent with footprint and rainfly. Three-season, freestanding design. Easy setup in under 10 minutes. Great for car camping or backpacking.",
    condition: "good",
    priceHourly: null,
    priceDaily: 20,
    priceWeekly: 80,
    priceMonthly: null,
    location: "Denver, CO",
    region: "West",
    latitude: 39.7392,
    longitude: -104.9903,
    categorySlug: "outdoor",
    ownerEmail: "elena.rodriguez@example.com",
    imageUrls: [
      "https://picsum.photos/seed/tent1/800/600",
      "https://picsum.photos/seed/tent2/800/600",
      "https://picsum.photos/seed/tent3/800/600",
    ],
  },
  {
    title: "Kayak with Paddle and Life Vest",
    description:
      "10-foot recreational kayak with adjustable padded seat, aluminum paddle, and Type III life vest. Includes car roof rack straps. Stable and great for lakes and calm rivers.",
    condition: "good",
    priceHourly: 10,
    priceDaily: 35,
    priceWeekly: 150,
    priceMonthly: null,
    location: "Denver, CO",
    region: "West",
    latitude: 39.7392,
    longitude: -104.9903,
    categorySlug: "outdoor",
    ownerEmail: "elena.rodriguez@example.com",
    imageUrls: [
      "https://picsum.photos/seed/kayak1/800/600",
      "https://picsum.photos/seed/kayak2/800/600",
    ],
  },
  {
    title: "Camping Stove and Cookware Set",
    description:
      "Coleman 2-burner propane stove with wind guards, plus a complete nesting cookware set with pots, pans, plates, and utensils for 4 people. Propane not included.",
    condition: "like_new",
    priceHourly: null,
    priceDaily: 12,
    priceWeekly: 50,
    priceMonthly: null,
    location: "Denver, CO",
    region: "West",
    latitude: 39.7392,
    longitude: -104.9903,
    categorySlug: "outdoor",
    ownerEmail: "elena.rodriguez@example.com",
    imageUrls: [
      "https://picsum.photos/seed/stove1/800/600",
      "https://picsum.photos/seed/stove2/800/600",
      "https://picsum.photos/seed/stove3/800/600",
    ],
  },

  // === James O'Connor - Nashville, TN (Music) ===
  {
    title: "Fender Acoustic Guitar",
    description:
      "Fender FA-135CE concert acoustic-electric guitar with built-in tuner. Rich, warm tone with comfortable neck. Comes with padded gig bag, strap, and spare strings.",
    condition: "good",
    priceHourly: null,
    priceDaily: 15,
    priceWeekly: 60,
    priceMonthly: 200,
    location: "Nashville, TN",
    region: "South",
    latitude: 36.1627,
    longitude: -86.7816,
    categorySlug: "music",
    ownerEmail: "james.oconnor@example.com",
    imageUrls: [
      "https://picsum.photos/seed/guitar1/800/600",
      "https://picsum.photos/seed/guitar2/800/600",
    ],
  },
  {
    title: "Roland Electric Drum Kit",
    description:
      "Roland TD-17KVX electronic drum set with mesh heads, hi-hat stand, kick pedal, and headphones. Silent practice with realistic feel. Over 300 built-in sounds.",
    condition: "like_new",
    priceHourly: null,
    priceDaily: 40,
    priceWeekly: 175,
    priceMonthly: 600,
    location: "Nashville, TN",
    region: "South",
    latitude: 36.1627,
    longitude: -86.7816,
    categorySlug: "music",
    ownerEmail: "james.oconnor@example.com",
    imageUrls: [
      "https://picsum.photos/seed/drums1/800/600",
      "https://picsum.photos/seed/drums2/800/600",
      "https://picsum.photos/seed/drums3/800/600",
    ],
  },
  {
    title: "PA Speaker System",
    description:
      "Pair of JBL EON715 powered speakers with stands, cables, and a 12-channel mixing board. Perfect for bands, DJs, events, and presentations. 1300W per speaker.",
    condition: "good",
    priceHourly: 25,
    priceDaily: 80,
    priceWeekly: 350,
    priceMonthly: null,
    location: "Nashville, TN",
    region: "South",
    latitude: 36.1627,
    longitude: -86.7816,
    categorySlug: "music",
    ownerEmail: "james.oconnor@example.com",
    imageUrls: [
      "https://picsum.photos/seed/speakers1/800/600",
      "https://picsum.photos/seed/speakers2/800/600",
    ],
  },

  // === Priya Patel - New York, NY (Clothing) ===
  {
    title: "Designer Evening Gown - Size M",
    description:
      "Stunning floor-length navy evening gown by Marchesa Notte. Size M (US 6-8). Beaded bodice with flowing chiffon skirt. Dry cleaned after every rental. Perfect for galas and formal events.",
    condition: "like_new",
    priceHourly: null,
    priceDaily: 65,
    priceWeekly: 250,
    priceMonthly: null,
    location: "New York, NY",
    region: "Northeast",
    latitude: 40.7128,
    longitude: -74.006,
    categorySlug: "clothing",
    ownerEmail: "priya.patel@example.com",
    imageUrls: [
      "https://picsum.photos/seed/gown1/800/600",
      "https://picsum.photos/seed/gown2/800/600",
      "https://picsum.photos/seed/gown3/800/600",
    ],
  },
  {
    title: "Men's Tailored Suit - Size 42R",
    description:
      "Hugo Boss slim-fit two-piece suit in charcoal gray. Size 42R jacket, 34x32 pants. Includes matching tie and pocket square. Professional dry cleaning included between rentals.",
    condition: "like_new",
    priceHourly: null,
    priceDaily: 55,
    priceWeekly: 200,
    priceMonthly: null,
    location: "New York, NY",
    region: "Northeast",
    latitude: 40.7128,
    longitude: -74.006,
    categorySlug: "clothing",
    ownerEmail: "priya.patel@example.com",
    imageUrls: [
      "https://picsum.photos/seed/suit1/800/600",
      "https://picsum.photos/seed/suit2/800/600",
    ],
  },
  {
    title: "Vintage Leather Jacket - Size L",
    description:
      "Authentic 1980s brown leather motorcycle jacket, perfectly worn in. Size L. Classic biker style with zippered pockets. Great for photo shoots, costumes, or everyday wear.",
    condition: "good",
    priceHourly: null,
    priceDaily: 30,
    priceWeekly: 120,
    priceMonthly: null,
    location: "New York, NY",
    region: "Northeast",
    latitude: 40.7128,
    longitude: -74.006,
    categorySlug: "clothing",
    ownerEmail: "priya.patel@example.com",
    imageUrls: [
      "https://picsum.photos/seed/leather1/800/600",
      "https://picsum.photos/seed/leather2/800/600",
      "https://picsum.photos/seed/leather3/800/600",
      "https://picsum.photos/seed/leather4/800/600",
    ],
  },

  // === Tom Baker - Portland, OR (Home & Garden) ===
  {
    title: "Stand Mixer - KitchenAid Pro",
    description:
      "KitchenAid Professional 600 Series 6-quart stand mixer in silver. Includes flat beater, dough hook, and wire whip. Powerful enough for bread dough and thick batters.",
    condition: "good",
    priceHourly: null,
    priceDaily: 18,
    priceWeekly: 70,
    priceMonthly: null,
    location: "Portland, OR",
    region: "West",
    latitude: 45.5152,
    longitude: -122.6784,
    categorySlug: "home-garden",
    ownerEmail: "tom.baker@example.com",
    imageUrls: [
      "https://picsum.photos/seed/mixer1/800/600",
      "https://picsum.photos/seed/mixer2/800/600",
    ],
  },
  {
    title: "Lawn Mower - Honda Self-Propelled",
    description:
      "Honda HRX217 21-inch self-propelled lawn mower with variable speed control and twin-blade MicroCut system. Mulch, bag, or discharge. Gas and oil not included.",
    condition: "good",
    priceHourly: 10,
    priceDaily: 30,
    priceWeekly: 120,
    priceMonthly: null,
    location: "Portland, OR",
    region: "West",
    latitude: 45.5152,
    longitude: -122.6784,
    categorySlug: "home-garden",
    ownerEmail: "tom.baker@example.com",
    imageUrls: [
      "https://picsum.photos/seed/mower1/800/600",
      "https://picsum.photos/seed/mower2/800/600",
      "https://picsum.photos/seed/mower3/800/600",
    ],
  },
  {
    title: "Pressure Canner Set",
    description:
      "Presto 23-quart pressure canner with gauge and jar rack. Includes Ball canning book, funnel, lid lifter, and jar tongs. Perfect for preserving seasonal produce.",
    condition: "like_new",
    priceHourly: null,
    priceDaily: 12,
    priceWeekly: 45,
    priceMonthly: null,
    location: "Portland, OR",
    region: "West",
    latitude: 45.5152,
    longitude: -122.6784,
    categorySlug: "home-garden",
    ownerEmail: "tom.baker@example.com",
    imageUrls: [
      "https://picsum.photos/seed/canner1/800/600",
      "https://picsum.photos/seed/canner2/800/600",
    ],
  },

  // === Lisa Nakamura - Seattle, WA (Sports) ===
  {
    title: "Peloton Exercise Bike",
    description:
      "Peloton Bike with 22-inch HD touchscreen. Includes cycling shoes (size 9/10), resistance bands, and mat. Subscription NOT included -- bring your own or use in free ride mode.",
    condition: "good",
    priceHourly: null,
    priceDaily: 25,
    priceWeekly: 100,
    priceMonthly: 350,
    location: "Seattle, WA",
    region: "West",
    latitude: 47.6062,
    longitude: -122.3321,
    categorySlug: "sports",
    ownerEmail: "lisa.nakamura@example.com",
    imageUrls: [
      "https://picsum.photos/seed/peloton1/800/600",
      "https://picsum.photos/seed/peloton2/800/600",
      "https://picsum.photos/seed/peloton3/800/600",
    ],
  },
  {
    title: "Snowboard with Bindings and Boots",
    description:
      "Burton Custom 158cm snowboard with Burton Cartel bindings and Ruler boots (size 10). All-mountain board suited for intermediate to advanced riders. Freshly waxed and tuned.",
    condition: "good",
    priceHourly: null,
    priceDaily: 35,
    priceWeekly: 150,
    priceMonthly: null,
    location: "Seattle, WA",
    region: "West",
    latitude: 47.6062,
    longitude: -122.3321,
    categorySlug: "sports",
    ownerEmail: "lisa.nakamura@example.com",
    imageUrls: [
      "https://picsum.photos/seed/snowboard1/800/600",
      "https://picsum.photos/seed/snowboard2/800/600",
    ],
  },
  {
    title: "Road Bike - Carbon Frame",
    description:
      "Specialized Roubaix carbon road bike, size 56cm. Shimano 105 groupset, disc brakes, and 28mm tires. Includes helmet, lights, and flat repair kit. Fits riders 5'9\" to 6'1\".",
    condition: "like_new",
    priceHourly: 8,
    priceDaily: 40,
    priceWeekly: 175,
    priceMonthly: 600,
    location: "Seattle, WA",
    region: "West",
    latitude: 47.6062,
    longitude: -122.3321,
    categorySlug: "sports",
    ownerEmail: "lisa.nakamura@example.com",
    imageUrls: [
      "https://picsum.photos/seed/roadbike1/800/600",
      "https://picsum.photos/seed/roadbike2/800/600",
      "https://picsum.photos/seed/roadbike3/800/600",
    ],
  },

  // === Extra listings for vehicle & variety (using existing users) ===
  {
    title: "Electric Scooter - Segway Ninebot",
    description:
      "Segway Ninebot Max electric scooter with 40-mile range and top speed of 18.6 mph. Foldable design, front and rear lights, and pneumatic tires. Helmet included.",
    condition: "like_new",
    priceHourly: 8,
    priceDaily: 25,
    priceWeekly: 100,
    priceMonthly: 350,
    location: "San Francisco, CA",
    region: "West",
    latitude: 37.7749,
    longitude: -122.4194,
    categorySlug: "vehicles",
    ownerEmail: "sarah.chen@example.com",
    imageUrls: [
      "https://picsum.photos/seed/scooter1/800/600",
      "https://picsum.photos/seed/scooter2/800/600",
    ],
  },
  {
    title: "Yoga Mat and Props Set",
    description:
      "Premium Manduka PRO yoga mat with cork blocks, strap, and bolster. Mat is 6mm thick with superior cushioning. Cleaned and sanitized between rentals. Great for retreats or trying yoga at home.",
    condition: "like_new",
    priceHourly: null,
    priceDaily: 10,
    priceWeekly: 40,
    priceMonthly: null,
    location: "New York, NY",
    region: "Northeast",
    latitude: 40.7128,
    longitude: -74.006,
    categorySlug: "sports",
    ownerEmail: "priya.patel@example.com",
    imageUrls: [
      "https://picsum.photos/seed/yoga1/800/600",
      "https://picsum.photos/seed/yoga2/800/600",
    ],
  },
  {
    title: "GoPro HERO12 Bundle",
    description:
      "GoPro HERO12 Black with waterproof housing, chest mount, head strap, handlebar mount, and 3 batteries. Shoots 5.3K video. Perfect for adventure sports and travel content.",
    condition: "new",
    priceHourly: 10,
    priceDaily: 30,
    priceWeekly: 130,
    priceMonthly: null,
    location: "Denver, CO",
    region: "West",
    latitude: 39.7392,
    longitude: -104.9903,
    categorySlug: "electronics",
    ownerEmail: "elena.rodriguez@example.com",
    imageUrls: [
      "https://picsum.photos/seed/gopro1/800/600",
      "https://picsum.photos/seed/gopro2/800/600",
      "https://picsum.photos/seed/gopro3/800/600",
    ],
  },
];
