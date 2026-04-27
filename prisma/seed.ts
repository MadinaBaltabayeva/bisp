import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES } from "../src/features/seed/categories";
import { SEED_LISTINGS } from "../src/features/seed/listings";
import {
  SEED_RENTALS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_REVIEWS,
} from "../src/features/seed/rentals";
import { auth } from "../src/lib/auth";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const DEMO_USERS = [
  {
    email: "sarah.chen@example.com",
    password: "password123",
    name: "Sarah Chen",
    bio: "DIY enthusiast and weekend warrior. Love sharing my tools with the community!",
    location: "San Francisco, CA",
  },
  {
    email: "marcus.johnson@example.com",
    password: "password123",
    name: "Marcus Johnson",
    bio: "Photographer and tech geek. Always happy to lend my gear to fellow creators.",
    location: "Austin, TX",
  },
  {
    email: "elena.rodriguez@example.com",
    password: "password123",
    name: "Elena Rodriguez",
    bio: "Outdoor adventure lover. Camping gear for every season available for rent.",
    location: "Denver, CO",
  },
  {
    email: "james.oconnor@example.com",
    password: "password123",
    name: "James O'Connor",
    bio: "Music teacher and performer. Instruments available for students and hobbyists.",
    location: "Nashville, TN",
  },
  {
    email: "priya.patel@example.com",
    password: "password123",
    name: "Priya Patel",
    bio: "Event planner with a closet full of formal wear. Rent instead of buy!",
    location: "New York, NY",
  },
  {
    email: "tom.baker@example.com",
    password: "password123",
    name: "Tom Baker",
    bio: "Retired contractor with a garage full of power tools. Happy to share them.",
    location: "Portland, OR",
  },
  {
    email: "lisa.nakamura@example.com",
    password: "password123",
    name: "Lisa Nakamura",
    bio: "Fitness instructor with extra sports equipment. Keep active, rent gear!",
    location: "Seattle, WA",
  },
];

const ADMIN_USER = {
  email: "admin@renthub.com",
  password: "password123",
  name: "Admin",
};

async function createUser(user: {
  email: string;
  password: string;
  name: string;
  bio?: string;
  location?: string;
}) {
  try {
    await auth.api.signUpEmail({
      body: {
        email: user.email,
        password: user.password,
        name: user.name,
      },
      asResponse: false,
    });

    // Update additional fields if provided
    if (user.bio || user.location) {
      await prisma.user.update({
        where: { email: user.email },
        data: {
          bio: user.bio || "",
          location: user.location || "",
        },
      });
    }

    return true;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    // User already exists - skip silently for idempotency
    if (
      message.includes("already") ||
      message.includes("unique") ||
      message.includes("exists") ||
      message.includes("UNIQUE")
    ) {
      return false;
    }
    console.error(`Failed to create user ${user.email}:`, message);
    return false;
  }
}

async function main() {
  console.log("Seeding database...\n");

  // Seed categories (upsert for idempotency)
  let categoriesCreated = 0;
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
    });
    categoriesCreated++;
  }
  console.log(`Seeded ${categoriesCreated} categories`);

  // Seed demo users
  let usersCreated = 0;
  for (const user of DEMO_USERS) {
    const created = await createUser(user);
    if (created) usersCreated++;
  }
  console.log(`Seeded ${usersCreated} demo users (${DEMO_USERS.length - usersCreated} already existed)`);

  // Seed admin user
  const adminCreated = await createUser(ADMIN_USER);
  if (adminCreated) {
    // Set admin role
    await prisma.user.update({
      where: { email: ADMIN_USER.email },
      data: { role: "admin" },
    });
    console.log("Created admin user with admin role");
  } else {
    // Ensure admin role is set even if user already exists
    try {
      await prisma.user.update({
        where: { email: ADMIN_USER.email },
        data: { role: "admin" },
      });
    } catch {
      // Admin user might not exist yet if signUp failed for a different reason
    }
    console.log("Admin user already exists");
  }

  console.log("\nAdmin account: admin@renthub.com / password123");

  // === Generate 120 extra users spread over 12 months ===
  const FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
    "Blake", "Cameron", "Dakota", "Emery", "Finley", "Harper", "Indigo", "Jesse",
    "Kelly", "Logan", "Madison", "Noel", "Oakley", "Parker", "Reagan", "Sage",
    "Tatum", "Val", "Winter", "Zion", "Aria", "Bryce", "Cody", "Diana",
    "Evan", "Fiona", "Grant", "Hazel", "Ivan", "Julia", "Kyle", "Luna",
    "Max", "Nora", "Oscar", "Penny", "Reed", "Sofia", "Troy", "Uma",
    "Victor", "Wendy", "Xavier", "Yara", "Zack", "Amber", "Ben", "Clara",
    "Derek", "Emma", "Frank", "Grace", "Henry", "Iris", "Jack", "Karen",
    "Leo", "Mia", "Nick", "Olive", "Paul", "Rose", "Sam", "Tina",
    "Uri", "Vera", "Will", "Xena", "Yuri", "Zara", "Adam", "Beth",
  ];
  const LAST_NAMES = [
    "Smith", "Lee", "Garcia", "Kim", "Brown", "Davis", "Wilson", "Moore",
    "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Clark",
    "Lewis", "Walker", "Hall", "Young", "Allen", "King", "Wright", "Scott",
    "Green", "Adams", "Nelson", "Hill", "Baker", "Carter", "Mitchell", "Roberts",
    "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart",
  ];
  const CITIES = [
    "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA",
    "San Antonio, TX", "San Diego, CA", "Dallas, TX", "Miami, FL", "Atlanta, GA",
    "Boston, MA", "Las Vegas, NV", "Detroit, MI", "Memphis, TN", "Baltimore, MD",
    "Milwaukee, WI", "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Kansas City, MO",
    "Charlotte, NC", "Omaha, NE", "Raleigh, NC", "Minneapolis, MN", "Tampa, FL",
  ];
  const BIOS = [
    "Love sharing my stuff with the community!",
    "Renting out gear I rarely use. Win-win!",
    "Always happy to help neighbors save money.",
    "Quality items at fair prices.",
    "Minimalist lifestyle — rent, don't buy!",
  ];

  const now = new Date();
  let bulkUsersCreated = 0;
  for (let i = 0; i < 120; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const suffix = i >= FIRST_NAMES.length ? `${Math.floor(i / FIRST_NAMES.length) + 1}` : "";
    const name = `${first} ${last}${suffix}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@example.com`;
    const city = CITIES[i % CITIES.length];

    const created = await createUser({
      email,
      password: "password123",
      name,
      bio: BIOS[i % BIOS.length],
      location: city,
    });
    if (created) {
      // Backdate user creation to spread across 12 months
      const monthsAgo = Math.floor(Math.random() * 12);
      const daysInMonth = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(now);
      createdAt.setMonth(createdAt.getMonth() - monthsAgo);
      createdAt.setDate(daysInMonth);
      await prisma.user.update({
        where: { email },
        data: { createdAt },
      });
      bulkUsersCreated++;
    }
  }
  console.log(`Seeded ${bulkUsersCreated} bulk users (120 target)`);

  // Seed listings (delete and recreate for idempotency)
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();

  let listingsCreated = 0;
  let imagesCreated = 0;

  for (const seedListing of SEED_LISTINGS) {
    const owner = await prisma.user.findUnique({
      where: { email: seedListing.ownerEmail },
    });
    if (!owner) {
      console.warn(`Skipping listing "${seedListing.title}" - owner ${seedListing.ownerEmail} not found`);
      continue;
    }

    const category = await prisma.category.findUnique({
      where: { slug: seedListing.categorySlug },
    });
    if (!category) {
      console.warn(`Skipping listing "${seedListing.title}" - category ${seedListing.categorySlug} not found`);
      continue;
    }

    await prisma.listing.create({
      data: {
        title: seedListing.title,
        description: seedListing.description,
        condition: seedListing.condition,
        priceHourly: seedListing.priceHourly,
        priceDaily: seedListing.priceDaily,
        priceWeekly: seedListing.priceWeekly,
        priceMonthly: seedListing.priceMonthly,
        location: seedListing.location,
        region: seedListing.region,
        latitude: seedListing.latitude,
        longitude: seedListing.longitude,
        status: "active",
        aiVerified: true,
        tags: "",
        ownerId: owner.id,
        categoryId: category.id,
        images: {
          create: seedListing.imageUrls.map((url, index) => ({
            url,
            isCover: index === 0,
            sortOrder: index,
          })),
        },
      },
    });

    listingsCreated++;
    imagesCreated += seedListing.imageUrls.length;
  }

  console.log(`\nSeeded ${listingsCreated} listings with ${imagesCreated} images`);

  // === Generate ~1000 bulk listings ===
  const LISTING_TEMPLATES: Record<string, { titles: string[]; descriptions: string[] }> = {
    tools: {
      titles: ["Cordless Drill Set", "Circular Saw", "Pressure Washer", "Angle Grinder", "Jigsaw", "Impact Driver", "Table Saw", "Rotary Hammer", "Belt Sander", "Nail Gun", "Heat Gun", "Tile Cutter", "Pipe Wrench Set", "Welding Machine", "Air Compressor"],
      descriptions: ["Professional grade, well maintained. Perfect for home projects and renovations.", "Heavy duty model with carrying case. Barely used, works like new.", "Complete kit with accessories. Great for DIY and professional use."],
    },
    electronics: {
      titles: ["4K Projector", "Drone with Camera", "DSLR Camera Body", "GoPro Hero", "VR Headset", "Portable Speaker", "Ring Light Kit", "Gimbal Stabilizer", "Wireless Microphone", "Studio Monitor", "Podcast Kit", "Action Camera", "Tablet Pro", "Gaming Console", "Smart Display"],
      descriptions: ["Latest model, comes with all accessories and original packaging.", "Perfect condition, ideal for events, content creation, or personal use.", "Professional quality equipment at a fraction of the purchase price."],
    },
    sports: {
      titles: ["Mountain Bike", "Tennis Racket Set", "Kayak", "Ski Equipment Set", "Golf Club Set", "Surfboard", "Boxing Gloves Set", "Yoga Mat Kit", "Camping Hammock", "Rock Climbing Gear", "Skateboard Pro", "Paddleboard", "Volleyball Net", "Weightlifting Set", "Cycling Trainer"],
      descriptions: ["Top brand, excellent condition. Perfect for weekend adventures.", "Complete set ready to use. Regularly maintained and cleaned.", "Great for beginners and experienced athletes alike."],
    },
    outdoor: {
      titles: ["4-Person Tent", "Camping Stove", "Hiking Backpack 65L", "Sleeping Bag -20°C", "Portable Grill", "Folding Kayak", "Binoculars Pro", "Fishing Rod Set", "Camping Chair Set", "Cooler 50L", "Headlamp Set", "Trekking Poles", "Camp Shower", "Fire Pit", "Outdoor Projector"],
      descriptions: ["Weatherproof and durable. Used for a few trips, in great shape.", "Perfect for family camping or solo adventures.", "Lightweight yet rugged. Ideal for any outdoor activity."],
    },
    vehicles: {
      titles: ["Electric Scooter", "Mountain Bike Pro", "Cargo Trailer", "Roof Rack System", "Electric Skateboard", "Bike Trailer", "Moped", "Go-Kart", "Canoe", "Snowmobile", "ATV", "Jet Ski", "Pontoon Boat", "Motorcycle", "RV Camper"],
      descriptions: ["Well maintained, fully charged and ready to ride.", "Perfect for getting around the city or weekend getaways.", "Reliable and fun. All safety gear included."],
    },
    clothing: {
      titles: ["Tuxedo Set", "Evening Gown", "Ski Jacket", "Halloween Costume Set", "Wedding Dress", "Leather Jacket", "Rain Gear Set", "Formal Suit", "Cosplay Outfit", "Winter Coat", "Hiking Boots", "Wet Suit", "Dance Costume", "Vintage Dress", "Snow Pants"],
      descriptions: ["Dry cleaned and ready to wear. Multiple sizes available.", "Perfect condition, worn only once. Looks brand new.", "High quality garment, great for special occasions."],
    },
    music: {
      titles: ["Acoustic Guitar", "Electric Keyboard", "Drum Kit", "Violin", "DJ Controller", "PA System", "Bass Guitar", "Saxophone", "Ukulele", "Flute", "Trumpet", "Cello", "Banjo", "Harmonica Set", "Cajon"],
      descriptions: ["Beautiful tone, well maintained. Perfect for practice or performance.", "Professional quality instrument in excellent condition.", "Includes case and basic accessories. Ready to play."],
    },
    "home-garden": {
      titles: ["Lawn Mower", "Leaf Blower", "Patio Heater", "Garden Tiller", "Hedge Trimmer", "Snow Blower", "Dehumidifier", "Stand Mixer", "Carpet Cleaner", "Power Washer", "Chain Saw", "Wood Chipper", "Portable AC", "Generator", "Irrigation System"],
      descriptions: ["Powerful and reliable. Makes yard work a breeze.", "Like new condition, used only a few times.", "Professional grade for home and garden maintenance."],
    },
  };

  const LATS_LNGS: [number, number][] = [
    [34.0522, -118.2437], [41.8781, -87.6298], [29.7604, -95.3698], [33.4484, -112.074],
    [39.9526, -75.1652], [29.4241, -98.4936], [32.7157, -117.1611], [32.7767, -96.797],
    [25.7617, -80.1918], [33.749, -84.388], [42.3601, -71.0589], [36.1699, -115.1398],
    [42.3314, -83.0458], [35.1495, -90.049], [39.2904, -76.6122], [43.0389, -87.9065],
    [32.2226, -110.9747], [36.7378, -119.7871], [38.5816, -121.4944], [39.0997, -94.5786],
    [35.2271, -80.8431], [41.2565, -95.9345], [35.7796, -78.6382], [44.9778, -93.265],
    [27.9506, -82.4572],
  ];

  const allCategories = await prisma.category.findMany();
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const allBulkUsers = await prisma.user.findMany({ select: { id: true } });
  const CONDITIONS = ["new", "like_new", "good", "good", "fair"];

  let bulkListingsCreated = 0;
  let bulkImagesCreated = 0;
  const categorySlugs = Object.keys(LISTING_TEMPLATES);

  for (let i = 0; i < 60; i++) {
    const slug = categorySlugs[i % categorySlugs.length];
    const templates = LISTING_TEMPLATES[slug];
    const category = categoryBySlug.get(slug)!;
    const titleBase = templates.titles[i % templates.titles.length];
    const suffix = Math.floor(i / categorySlugs.length / templates.titles.length);
    const title = suffix > 0 ? `${titleBase} #${suffix + 1}` : titleBase;
    const description = templates.descriptions[i % templates.descriptions.length];
    const owner = allBulkUsers[i % allBulkUsers.length];
    const [lat, lng] = LATS_LNGS[i % LATS_LNGS.length];
    const condition = CONDITIONS[i % CONDITIONS.length];
    const cityName = CITIES[i % CITIES.length];

    const priceDaily = Math.floor(Math.random() * 80) + 10;
    const monthsAgo = Math.floor(Math.random() * 12);
    const createdAt = new Date(now);
    createdAt.setMonth(createdAt.getMonth() - monthsAgo);
    createdAt.setDate(Math.floor(Math.random() * 28) + 1);

    const imageCount = Math.floor(Math.random() * 3) + 1;
    const images = Array.from({ length: imageCount }, (_, j) => ({
      url: `https://picsum.photos/seed/${slug}${i}img${j}/800/600`,
      isCover: j === 0,
      sortOrder: j,
    }));

    await prisma.listing.create({
      data: {
        title,
        description,
        condition,
        priceHourly: Math.random() > 0.5 ? Math.floor(priceDaily / 4) : null,
        priceDaily,
        priceWeekly: priceDaily * 5,
        priceMonthly: Math.random() > 0.3 ? priceDaily * 18 : null,
        location: cityName,
        region: "US",
        latitude: lat + (Math.random() - 0.5) * 0.1,
        longitude: lng + (Math.random() - 0.5) * 0.1,
        status: "active",
        aiVerified: Math.random() > 0.3,
        tags: "",
        ownerId: owner.id,
        categoryId: category.id,
        createdAt,
        images: { create: images },
      },
    });

    bulkListingsCreated++;
    bulkImagesCreated += imageCount;
  }

  console.log(`Seeded ${bulkListingsCreated} bulk listings with ${bulkImagesCreated} images`);

  // === FTS5 search index backfill ===
  // Ensure FTS5 virtual table exists
  await prisma.$executeRawUnsafe(
    `CREATE VIRTUAL TABLE IF NOT EXISTS listing_search USING fts5(listing_id UNINDEXED, title_en, title_ru, title_uz, desc_en, desc_ru, desc_uz, tags, tokenize='unicode61')`
  );
  // Clear existing FTS data for idempotency
  await prisma.$executeRawUnsafe(`DELETE FROM listing_search`);
  // Backfill all listings into FTS (using original text for all language columns -- no OpenAI in seed)
  const allListingsForFts = await prisma.listing.findMany({
    select: { id: true, title: true, description: true, tags: true },
  });
  for (const listing of allListingsForFts) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO listing_search(listing_id, title_en, title_ru, title_uz, desc_en, desc_ru, desc_uz, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      listing.id,
      listing.title,
      listing.title,
      listing.title,
      listing.description,
      listing.description,
      listing.description,
      listing.tags || ""
    );
  }
  console.log(
    `Backfilled ${allListingsForFts.length} listings into FTS5 search index`
  );

  // === Seed rentals, conversations, messages, and reviews ===
  try {
    // Get all users and listings for ID resolution
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const allListings = await prisma.listing.findMany({
      select: { id: true, ownerId: true, priceDaily: true },
      orderBy: { createdAt: "asc" },
    });

    const userByEmail = new Map(allUsers.map((u) => [u.email, u]));

    // Clean up existing rental lifecycle data for idempotency
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.rental.deleteMany();

    // Seed rentals
    const createdRentals: { id: string }[] = [];
    let rentalsCreated = 0;

    for (const seedRental of SEED_RENTALS) {
      const listing = allListings[seedRental.listingIndex];
      const renter = userByEmail.get(seedRental.renterEmail);

      if (!listing || !renter) {
        console.warn(`Skipping rental: listing index ${seedRental.listingIndex} or renter ${seedRental.renterEmail} not found`);
        createdRentals.push({ id: "" });
        continue;
      }

      const days = Math.ceil(
        (seedRental.endDate.getTime() - seedRental.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dailyRate = listing.priceDaily ?? 0;
      const totalPrice = days * dailyRate;
      const securityDeposit = totalPrice * 0.2;

      const rental = await prisma.rental.create({
        data: {
          startDate: seedRental.startDate,
          endDate: seedRental.endDate,
          status: seedRental.status,
          message: seedRental.message,
          totalPrice,
          securityDeposit,
          listingId: listing.id,
          renterId: renter.id,
          ownerId: listing.ownerId,
        },
      });

      createdRentals.push(rental);
      rentalsCreated++;
    }

    console.log(`Seeded ${rentalsCreated} rentals`);

    // Seed conversations
    const createdConversations: { id: string }[] = [];
    let conversationsCreated = 0;

    for (const seedConv of SEED_CONVERSATIONS) {
      const listing = allListings[seedConv.listingIndex];
      const user1 = userByEmail.get(seedConv.user1Email);
      const user2 = userByEmail.get(seedConv.user2Email);

      if (!listing || !user1 || !user2) {
        console.warn(`Skipping conversation: missing listing or user`);
        createdConversations.push({ id: "" });
        continue;
      }

      const rentalId =
        seedConv.rentalIndex !== undefined && createdRentals[seedConv.rentalIndex]?.id
          ? createdRentals[seedConv.rentalIndex].id
          : null;

      const conversation = await prisma.conversation.create({
        data: {
          listingId: listing.id,
          user1Id: user1.id,
          user2Id: user2.id,
          rentalId: rentalId || undefined,
        },
      });

      createdConversations.push(conversation);
      conversationsCreated++;
    }

    console.log(`Seeded ${conversationsCreated} conversations`);

    // Seed messages
    let messagesCreated = 0;

    for (const seedMsg of SEED_MESSAGES) {
      const conversation = createdConversations[seedMsg.conversationIndex];
      const sender = userByEmail.get(seedMsg.senderEmail);

      if (!conversation?.id || !sender) {
        continue;
      }

      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() - 48); // Start messages 2 days ago
      const msgTime = new Date(baseTime.getTime() + seedMsg.minutesOffset * 60000);

      await prisma.message.create({
        data: {
          content: seedMsg.content,
          read: seedMsg.read,
          senderId: sender.id,
          conversationId: conversation.id,
          createdAt: msgTime,
        },
      });

      messagesCreated++;
    }

    console.log(`Seeded ${messagesCreated} messages`);

    // Seed reviews
    let reviewsCreated = 0;

    for (const seedReview of SEED_REVIEWS) {
      const rental = createdRentals[seedReview.rentalIndex];
      const reviewer = userByEmail.get(seedReview.reviewerEmail);
      const reviewee = userByEmail.get(seedReview.revieweeEmail);

      if (!rental?.id || !reviewer || !reviewee) {
        continue;
      }

      await prisma.review.create({
        data: {
          rating: seedReview.rating,
          comment: seedReview.comment,
          rentalId: rental.id,
          reviewerId: reviewer.id,
          revieweeId: reviewee.id,
        },
      });

      reviewsCreated++;
    }

    console.log(`Seeded ${reviewsCreated} reviews`);

    // Recalculate averageRating and reviewCount for all reviewed users
    const reviewedUserIds = [...new Set(SEED_REVIEWS.map((r) => userByEmail.get(r.revieweeEmail)?.id).filter(Boolean))] as string[];

    for (const userId of reviewedUserIds) {
      const aggregate = await prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          averageRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
          reviewCount: aggregate._count.rating,
        },
      });
    }

    console.log(`Recalculated ratings for ${reviewedUserIds.length} users`);

    // === Phase 8: Backfill RentalEvent rows for existing rentals ===
    await prisma.rentalEvent.deleteMany();

    const STATUS_ORDER = ["requested", "approved", "active", "returned", "completed"];
    let eventsCreated = 0;

    const allRentals = await prisma.rental.findMany({
      select: { id: true, status: true, renterId: true, ownerId: true, createdAt: true },
    });

    for (const rental of allRentals) {
      const baseTime = new Date(rental.createdAt);

      // Always create the initial "requested" event
      await prisma.rentalEvent.create({
        data: {
          rentalId: rental.id,
          status: "requested",
          actorId: rental.renterId,
          createdAt: baseTime,
        },
      });
      eventsCreated++;

      if (rental.status === "declined") {
        // Declined is an alternate path from requested
        const declinedTime = new Date(baseTime.getTime() + 60 * 60 * 1000);
        await prisma.rentalEvent.create({
          data: {
            rentalId: rental.id,
            status: "declined",
            actorId: rental.ownerId,
            createdAt: declinedTime,
          },
        });
        eventsCreated++;
      } else if (rental.status !== "requested") {
        // Walk through status order and create events up to current status
        const currentIndex = STATUS_ORDER.indexOf(rental.status);
        if (currentIndex > 0) {
          for (let i = 1; i <= currentIndex; i++) {
            const eventTime = new Date(baseTime.getTime() + i * 60 * 60 * 1000);
            await prisma.rentalEvent.create({
              data: {
                rentalId: rental.id,
                status: STATUS_ORDER[i],
                actorId: rental.ownerId,
                createdAt: eventTime,
              },
            });
            eventsCreated++;
          }
        }
      }
    }

    console.log(`Backfilled ${eventsCreated} rental events for ${allRentals.length} rentals`);
  } catch (error) {
    console.error("Error seeding rental lifecycle data:", error);
  }

  // Mark select demo users and admin as ID-verified
  const verifiedEmails = [
    "sarah.chen@example.com",
    "marcus.johnson@example.com",
    "elena.rodriguez@example.com",
    "admin@renthub.com",
  ];
  for (const email of verifiedEmails) {
    try {
      await prisma.user.update({
        where: { email },
        data: { idVerified: true },
      });
    } catch {
      // user might not exist yet
    }
  }
  console.log(`Marked ${verifiedEmails.length} users as ID-verified`);

  // === Seed 12 months of rich analytics data ===
  await prisma.analyticsEvent.deleteMany();

  const allListingsForAnalytics = await prisma.listing.findMany({
    select: { id: true, ownerId: true },
  });
  const allUsersForAnalytics = await prisma.user.findMany({
    select: { id: true },
  });

  const YEAR_DAYS = 365;

  // Growth curve: traffic increases over 12 months (simulates platform growth)
  function growthMultiplier(daysAgo: number): number {
    // Recent days get more traffic (exponential-ish growth)
    const age = 1 - daysAgo / YEAR_DAYS; // 0 = oldest, 1 = today
    return 0.3 + age * 0.7; // ranges from 0.3x to 1x
  }

  // Seasonal bump: summer months get more rentals
  function seasonalMultiplier(date: Date): number {
    const month = date.getMonth();
    // Jun-Aug peak, Dec-Jan dip
    const seasonal: Record<number, number> = {
      0: 0.7, 1: 0.75, 2: 0.85, 3: 0.95, 4: 1.1, 5: 1.3,
      6: 1.4, 7: 1.35, 8: 1.15, 9: 1.0, 10: 0.8, 11: 0.65,
    };
    return seasonal[month] ?? 1;
  }

  function randomDate(daysAgo: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
    return d;
  }

  // Generate events in streaming batches to avoid OOM
  // Sample 100 listings instead of all 1000+ to keep it manageable
  const sampledListings = allListingsForAnalytics
    .sort(() => Math.random() - 0.5)
    .slice(0, 100);

  let totalEvents = 0;
  const BATCH_SIZE = 2000;
  let batch: {
    type: string;
    listingId: string | null;
    userId: string | null;
    viewerId: string | null;
    createdAt: Date;
  }[] = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.analyticsEvent.createMany({ data: batch });
    totalEvents += batch.length;
    batch = [];
  }

  for (const listing of sampledListings) {
    for (let daysAgo = 0; daysAgo < YEAR_DAYS; daysAgo++) {
      const date = randomDate(daysAgo);
      const gm = growthMultiplier(daysAgo);
      const sm = seasonalMultiplier(date);
      const multiplier = gm * sm;

      const dailyImpressions = Math.floor((Math.random() * 5 + 2) * multiplier);
      const dailyViews = Math.floor((Math.random() * 2 + 1) * multiplier);

      for (let i = 0; i < dailyImpressions; i++) {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() + Math.floor(Math.random() * 60 * 14));
        batch.push({ type: "search_impression", listingId: listing.id, userId: listing.ownerId, viewerId: null, createdAt: d });
      }

      for (let i = 0; i < dailyViews; i++) {
        const viewer = allUsersForAnalytics[Math.floor(Math.random() * allUsersForAnalytics.length)];
        const d = new Date(date);
        d.setMinutes(d.getMinutes() + Math.floor(Math.random() * 60 * 14));
        batch.push({ type: "listing_view", listingId: listing.id, userId: listing.ownerId, viewerId: viewer.id !== listing.ownerId ? viewer.id : null, createdAt: d });
      }

      if (batch.length >= BATCH_SIZE) await flushBatch();
    }
  }

  // Profile views
  for (const user of allUsersForAnalytics) {
    for (let daysAgo = 0; daysAgo < YEAR_DAYS; daysAgo += 3) {
      const count = Math.random() < 0.5 ? Math.floor(Math.random() * 3) + 1 : 0;
      for (let i = 0; i < count; i++) {
        const viewer = allUsersForAnalytics[Math.floor(Math.random() * allUsersForAnalytics.length)];
        batch.push({ type: "profile_view", listingId: null, userId: user.id, viewerId: viewer.id !== user.id ? viewer.id : null, createdAt: randomDate(daysAgo) });
      }
      if (batch.length >= BATCH_SIZE) await flushBatch();
    }
  }

  await flushBatch();
  console.log(`Seeded ${totalEvents} analytics events (12-month history)`);

  // === Seed 300+ rentals spread across 12 months ===
  const RENTAL_STATUSES = ["completed", "completed", "completed", "completed", "active", "returned", "declined", "cancelled"];
  const allListingsForRentals = await prisma.listing.findMany({
    select: { id: true, ownerId: true, priceDaily: true },
  });
  let extraRentals = 0;
  const RENTAL_MESSAGES = [
    "Would love to rent this!", "Is this still available?", "Need it for the weekend.",
    "Planning a project, this would be perfect.", "How soon can I pick it up?",
  ];

  // Get demo user IDs to ensure they get good rental data
  const demoEmails = DEMO_USERS.map((u) => u.email);
  const demoUserRecords = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true },
  });
  const demoUserIds = new Set(demoUserRecords.map((u) => u.id));

  // Split listings: demo user listings get more rentals
  const demoListings = allListingsForRentals.filter((l) => demoUserIds.has(l.ownerId));
  const otherListings = allListingsForRentals.filter((l) => !demoUserIds.has(l.ownerId));

  async function createRentalForListing(listing: typeof allListingsForRentals[0], monthsAgo: number) {
    const baseDate = new Date(now);
    baseDate.setMonth(baseDate.getMonth() - monthsAgo);
    const renterPool = allUsersForAnalytics.filter((u) => u.id !== listing.ownerId);
    const renter = renterPool[Math.floor(Math.random() * renterPool.length)];

    const dayOffset = Math.floor(Math.random() * 28);
    const startDate = new Date(baseDate);
    startDate.setDate(dayOffset + 1);
    const rentalDays = Math.floor(Math.random() * 7) + 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + rentalDays);

    const dailyRate = listing.priceDaily ?? 25;
    const totalPrice = rentalDays * dailyRate;
    const status = RENTAL_STATUSES[Math.floor(Math.random() * RENTAL_STATUSES.length)];

    await prisma.rental.create({
      data: {
        startDate,
        endDate,
        status,
        message: RENTAL_MESSAGES[Math.floor(Math.random() * RENTAL_MESSAGES.length)],
        totalPrice,
        securityDeposit: totalPrice * 0.2,
        listingId: listing.id,
        renterId: renter.id,
        ownerId: listing.ownerId,
        createdAt: startDate,
      },
    });
    extraRentals++;
  }

  // Demo user listings: 3-6 rentals per listing per month = very rich dashboards
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    for (const listing of demoListings) {
      const count = Math.floor(Math.random() * 4) + 3;
      for (let i = 0; i < count; i++) {
        await createRentalForListing(listing, monthsAgo);
      }
    }
  }

  // Other listings: general platform rentals with growth
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const baseDate = new Date(now);
    baseDate.setMonth(baseDate.getMonth() - monthsAgo);
    const sm = seasonalMultiplier(baseDate);
    const gm = 1 - monthsAgo * 0.05;
    const rentalsThisMonth = Math.floor((Math.random() * 15 + 18) * sm * gm);

    for (let i = 0; i < rentalsThisMonth; i++) {
      const listing = otherListings[Math.floor(Math.random() * otherListings.length)];
      await createRentalForListing(listing, monthsAgo);
    }
  }
  console.log(`Seeded ${extraRentals} extra rentals (12-month history)`);

  // === Seed extra reviews for completed rentals ===
  const completedRentals = await prisma.rental.findMany({
    where: { status: "completed" },
    select: { id: true, renterId: true, ownerId: true, createdAt: true },
  });
  const REVIEW_COMMENTS = [
    "Great experience! Item was exactly as described.",
    "Very helpful owner, quick responses.",
    "Item was in perfect condition. Would rent again!",
    "Smooth pickup and return process.",
    "Good value for the price. Recommended!",
    "Everything went smoothly. Five stars!",
    "The item worked perfectly for my project.",
    "Excellent communication throughout the rental.",
    "Fair price, great quality. Happy customer!",
    "Quick and easy. Will definitely come back.",
  ];
  let extraReviews = 0;

  for (const rental of completedRentals) {
    // 70% chance of review
    if (Math.random() > 0.7) continue;
    // Check if review already exists
    const existing = await prisma.review.findUnique({
      where: { rentalId_reviewerId: { rentalId: rental.id, reviewerId: rental.renterId } },
    });
    if (existing) continue;

    const rating = Math.random() > 0.15 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 2; // mostly 4-5
    await prisma.review.create({
      data: {
        rating,
        comment: REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)],
        rentalId: rental.id,
        reviewerId: rental.renterId,
        revieweeId: rental.ownerId,
        createdAt: new Date(rental.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    extraReviews++;
  }
  console.log(`Seeded ${extraReviews} extra reviews`);

  // Recalculate ratings for all reviewed users
  const allReviewedUsers = await prisma.review.findMany({
    select: { revieweeId: true },
    distinct: ["revieweeId"],
  });
  for (const { revieweeId } of allReviewedUsers) {
    const agg = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });
  }
  console.log(`Recalculated ratings for ${allReviewedUsers.length} users`);

  // Print summary
  const totalCategories = await prisma.category.count();
  const totalUsers = await prisma.user.count();
  const totalListings = await prisma.listing.count();
  const totalImages = await prisma.listingImage.count();
  const totalRentals = await prisma.rental.count();
  const totalConversations = await prisma.conversation.count();
  const totalMessages = await prisma.message.count();
  const totalReviews = await prisma.review.count();
  console.log(`\nSeed complete! ${totalCategories} categories, ${totalUsers} users, ${totalListings} listings, ${totalImages} images, ${totalRentals} rentals, ${totalConversations} conversations, ${totalMessages} messages, ${totalReviews} reviews in database.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
