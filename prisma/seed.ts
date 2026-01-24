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
  } catch (error) {
    console.error("Error seeding rental lifecycle data:", error);
  }

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
