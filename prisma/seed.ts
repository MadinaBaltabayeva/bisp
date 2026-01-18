import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES } from "../src/features/seed/categories";
import { SEED_LISTINGS } from "../src/features/seed/listings";
import { auth } from "../src/lib/auth";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
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

  // Print summary
  const totalCategories = await prisma.category.count();
  const totalUsers = await prisma.user.count();
  const totalListings = await prisma.listing.count();
  const totalImages = await prisma.listingImage.count();
  console.log(`\nSeed complete! ${totalCategories} categories, ${totalUsers} users, ${totalListings} listings, ${totalImages} images in database.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
