/**
 * Seed data for rentals, conversations, messages, and reviews.
 *
 * These use indices and references that get resolved to actual IDs
 * during seeding (after users and listings are created).
 */

export interface SeedRental {
  /** Index into SEED_LISTINGS array (for the listing) */
  listingIndex: number;
  /** Email of the renter */
  renterEmail: string;
  status: "requested" | "approved" | "active" | "returned" | "completed" | "declined";
  startDate: Date;
  endDate: Date;
  message: string;
}

export interface SeedConversation {
  /** Index into SEED_LISTINGS */
  listingIndex: number;
  /** Email of user1 (typically listing owner) */
  user1Email: string;
  /** Email of user2 (typically renter) */
  user2Email: string;
  /** Optional: link to rental index */
  rentalIndex?: number;
}

export interface SeedMessage {
  /** Index into SEED_CONVERSATIONS */
  conversationIndex: number;
  /** Email of the sender */
  senderEmail: string;
  content: string;
  read: boolean;
  /** Minutes offset from conversation creation (for ordering) */
  minutesOffset: number;
}

export interface SeedReview {
  /** Index into SEED_RENTALS (must be a completed rental) */
  rentalIndex: number;
  /** Email of the reviewer */
  reviewerEmail: string;
  /** Email of the reviewee */
  revieweeEmail: string;
  rating: number;
  comment: string;
}

// Date helpers
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

export const SEED_RENTALS: SeedRental[] = [
  // Completed rentals (for reviews)
  {
    listingIndex: 0, // DeWalt Power Drill Kit (Sarah)
    renterEmail: "marcus.johnson@example.com",
    status: "completed",
    startDate: daysAgo(30),
    endDate: daysAgo(25),
    message: "Need it for a weekend project. Will take great care of it!",
  },
  {
    listingIndex: 3, // Sony A7III Camera Kit (Marcus)
    renterEmail: "elena.rodriguez@example.com",
    status: "completed",
    startDate: daysAgo(20),
    endDate: daysAgo(15),
    message: "Shooting a hiking documentary in the Rockies. Very experienced with cameras.",
  },
  {
    listingIndex: 6, // 4-Person Backpacking Tent (Elena)
    renterEmail: "james.oconnor@example.com",
    status: "completed",
    startDate: daysAgo(14),
    endDate: daysAgo(10),
    message: "Planning a camping trip with friends. We'll clean it before returning.",
  },
  // Active rentals
  {
    listingIndex: 9, // Fender Acoustic Guitar (James)
    renterEmail: "priya.patel@example.com",
    status: "active",
    startDate: daysAgo(3),
    endDate: daysFromNow(4),
    message: "Learning guitar for a music video production.",
  },
  {
    listingIndex: 17, // Snowboard (Lisa)
    renterEmail: "tom.baker@example.com",
    status: "active",
    startDate: daysAgo(1),
    endDate: daysFromNow(5),
    message: "Heading to Mt. Hood this weekend!",
  },
  // Approved rental
  {
    listingIndex: 11, // PA Speaker System (James)
    renterEmail: "lisa.nakamura@example.com",
    status: "approved",
    startDate: daysFromNow(3),
    endDate: daysFromNow(5),
    message: "Need speakers for a community fitness event in the park.",
  },
  // Requested rentals
  {
    listingIndex: 4, // DJI Mavic 3 Drone (Marcus)
    renterEmail: "tom.baker@example.com",
    status: "requested",
    startDate: daysFromNow(7),
    endDate: daysFromNow(10),
    message: "Want to capture aerial footage of my property for a renovation plan.",
  },
  {
    listingIndex: 12, // Designer Evening Gown (Priya)
    renterEmail: "sarah.chen@example.com",
    status: "requested",
    startDate: daysFromNow(14),
    endDate: daysFromNow(16),
    message: "Attending a charity gala next month. Size M should be perfect!",
  },
  {
    listingIndex: 15, // Stand Mixer (Tom)
    renterEmail: "elena.rodriguez@example.com",
    status: "requested",
    startDate: daysFromNow(5),
    endDate: daysFromNow(7),
    message: "Baking for a friend's birthday party this weekend.",
  },
  // Declined rental
  {
    listingIndex: 18, // Road Bike (Lisa)
    renterEmail: "marcus.johnson@example.com",
    status: "declined",
    startDate: daysAgo(7),
    endDate: daysAgo(5),
    message: "Would love to try road biking around Town Lake.",
  },
];

export const SEED_CONVERSATIONS: SeedConversation[] = [
  {
    listingIndex: 0, // DeWalt Drill
    user1Email: "sarah.chen@example.com",
    user2Email: "marcus.johnson@example.com",
    rentalIndex: 0,
  },
  {
    listingIndex: 3, // Sony A7III
    user1Email: "marcus.johnson@example.com",
    user2Email: "elena.rodriguez@example.com",
    rentalIndex: 1,
  },
  {
    listingIndex: 6, // Tent
    user1Email: "elena.rodriguez@example.com",
    user2Email: "james.oconnor@example.com",
    rentalIndex: 2,
  },
  {
    listingIndex: 4, // DJI Drone
    user1Email: "marcus.johnson@example.com",
    user2Email: "tom.baker@example.com",
    rentalIndex: 6,
  },
  {
    listingIndex: 12, // Evening Gown
    user1Email: "priya.patel@example.com",
    user2Email: "sarah.chen@example.com",
    rentalIndex: 7,
  },
  {
    listingIndex: 9, // Guitar
    user1Email: "james.oconnor@example.com",
    user2Email: "priya.patel@example.com",
    rentalIndex: 3,
  },
];

export const SEED_MESSAGES: SeedMessage[] = [
  // Conversation 0: Sarah <-> Marcus about drill
  { conversationIndex: 0, senderEmail: "marcus.johnson@example.com", content: "Hi Sarah! Is the drill still available for next weekend?", read: true, minutesOffset: 0 },
  { conversationIndex: 0, senderEmail: "sarah.chen@example.com", content: "Yes, it's available! What kind of project are you working on?", read: true, minutesOffset: 15 },
  { conversationIndex: 0, senderEmail: "marcus.johnson@example.com", content: "Building some shelves in my home studio. I'll need it for about 5 days.", read: true, minutesOffset: 30 },
  { conversationIndex: 0, senderEmail: "sarah.chen@example.com", content: "Sounds great! Just make sure to charge both batteries before returning. Go ahead and submit a rental request.", read: true, minutesOffset: 45 },
  { conversationIndex: 0, senderEmail: "marcus.johnson@example.com", content: "Thanks! The drill worked perfectly. Returning it today with fresh batteries.", read: true, minutesOffset: 7200 },

  // Conversation 1: Marcus <-> Elena about camera
  { conversationIndex: 1, senderEmail: "elena.rodriguez@example.com", content: "Marcus, I'd love to rent the A7III for a hiking documentary. Do you have a telephoto lens too?", read: true, minutesOffset: 0 },
  { conversationIndex: 1, senderEmail: "marcus.johnson@example.com", content: "The kit comes with the 28-70mm. I don't have a telephoto for rent yet, but the kit lens is great for landscapes!", read: true, minutesOffset: 20 },
  { conversationIndex: 1, senderEmail: "elena.rodriguez@example.com", content: "That works perfectly for what I need. I'll be super careful with it in the field.", read: true, minutesOffset: 35 },
  { conversationIndex: 1, senderEmail: "marcus.johnson@example.com", content: "No worries, I can tell you know your way around cameras. Approved! Pick up whenever.", read: true, minutesOffset: 50 },

  // Conversation 2: Elena <-> James about tent
  { conversationIndex: 2, senderEmail: "james.oconnor@example.com", content: "Hey Elena! Is the tent waterproof? We might hit some rain.", read: true, minutesOffset: 0 },
  { conversationIndex: 2, senderEmail: "elena.rodriguez@example.com", content: "Absolutely! The rainfly is fully waterproof. I've used it in heavy Colorado storms with no issues.", read: true, minutesOffset: 10 },
  { conversationIndex: 2, senderEmail: "james.oconnor@example.com", content: "Perfect. We're heading to Great Smoky Mountains. 4 of us total.", read: true, minutesOffset: 25 },
  { conversationIndex: 2, senderEmail: "elena.rodriguez@example.com", content: "Great choice! The tent fits 4 comfortably. I'll include the footprint too. Just shake it out before returning.", read: true, minutesOffset: 40 },

  // Conversation 3: Marcus <-> Tom about drone
  { conversationIndex: 3, senderEmail: "tom.baker@example.com", content: "Hi Marcus, I'm interested in the drone for some aerial property photos. Do I need FAA registration?", read: true, minutesOffset: 0 },
  { conversationIndex: 3, senderEmail: "marcus.johnson@example.com", content: "Great question! You technically need a recreational flyer registration ($5 on the FAA site). Takes 5 minutes. What's the property size?", read: true, minutesOffset: 30 },
  { conversationIndex: 3, senderEmail: "tom.baker@example.com", content: "About 2 acres. I'm planning a major renovation and want before/after shots from above.", read: false, minutesOffset: 60 },
  { conversationIndex: 3, senderEmail: "tom.baker@example.com", content: "Also, can you show me the basic controls when I pick it up?", read: false, minutesOffset: 65 },

  // Conversation 4: Priya <-> Sarah about evening gown
  { conversationIndex: 4, senderEmail: "sarah.chen@example.com", content: "Hi Priya! The evening gown looks perfect for a gala I'm attending. Is size M true to size?", read: true, minutesOffset: 0 },
  { conversationIndex: 4, senderEmail: "priya.patel@example.com", content: "Hi Sarah! Yes, it fits a standard US 6-8 perfectly. The bodice has a slight stretch for comfort. What event is it for?", read: true, minutesOffset: 20 },
  { conversationIndex: 4, senderEmail: "sarah.chen@example.com", content: "A tech industry charity gala downtown. Want to look my best!", read: true, minutesOffset: 40 },
  { conversationIndex: 4, senderEmail: "priya.patel@example.com", content: "You'll look amazing in it! I'll have it freshly dry cleaned for you. The beaded bodice photographs beautifully.", read: false, minutesOffset: 55 },

  // Conversation 5: James <-> Priya about guitar
  { conversationIndex: 5, senderEmail: "priya.patel@example.com", content: "James, I need the guitar for a music video we're producing. Is it in tune?", read: true, minutesOffset: 0 },
  { conversationIndex: 5, senderEmail: "james.oconnor@example.com", content: "Always! I tune it before every rental. The built-in tuner makes it easy to keep in tune too. What song?", read: true, minutesOffset: 15 },
  { conversationIndex: 5, senderEmail: "priya.patel@example.com", content: "It's an original piece for a friend's short film. Nothing too complex, mostly rhythm.", read: true, minutesOffset: 30 },
  { conversationIndex: 5, senderEmail: "james.oconnor@example.com", content: "That's awesome! The FA-135CE has a great warm tone for that. Pick it up whenever you're ready.", read: true, minutesOffset: 45 },
  { conversationIndex: 5, senderEmail: "priya.patel@example.com", content: "Thanks! Picking it up this afternoon.", read: true, minutesOffset: 60 },
];

export const SEED_REVIEWS: SeedReview[] = [
  // Rental 0: Marcus reviewed Sarah (owner of drill)
  {
    rentalIndex: 0,
    reviewerEmail: "marcus.johnson@example.com",
    revieweeEmail: "sarah.chen@example.com",
    rating: 5,
    comment: "Sarah's drill kit was in perfect condition. Both batteries were fully charged and she even included extra drill bits. Super responsive communication!",
  },
  // Rental 0: Sarah reviewed Marcus (renter)
  {
    rentalIndex: 0,
    reviewerEmail: "sarah.chen@example.com",
    revieweeEmail: "marcus.johnson@example.com",
    rating: 5,
    comment: "Marcus returned everything in great shape with freshly charged batteries. A model renter!",
  },
  // Rental 1: Elena reviewed Marcus (owner of camera)
  {
    rentalIndex: 1,
    reviewerEmail: "elena.rodriguez@example.com",
    revieweeEmail: "marcus.johnson@example.com",
    rating: 5,
    comment: "The Sony A7III was amazing for my documentary shoot. Marcus gave me helpful tips on the settings. Highly recommend!",
  },
  // Rental 1: Marcus reviewed Elena (renter)
  {
    rentalIndex: 1,
    reviewerEmail: "marcus.johnson@example.com",
    revieweeEmail: "elena.rodriguez@example.com",
    rating: 4,
    comment: "Elena took great care of the camera. Returned it clean and on time. Would rent to again!",
  },
  // Rental 2: James reviewed Elena (owner of tent)
  {
    rentalIndex: 2,
    reviewerEmail: "james.oconnor@example.com",
    revieweeEmail: "elena.rodriguez@example.com",
    rating: 5,
    comment: "The tent was perfect for our camping trip! Held up great in rain. Elena included extra stakes and a ground cloth. Excellent experience!",
  },
  // Rental 2: Elena reviewed James (renter)
  {
    rentalIndex: 2,
    reviewerEmail: "elena.rodriguez@example.com",
    revieweeEmail: "james.oconnor@example.com",
    rating: 4,
    comment: "James returned the tent clean and dry. Appreciated that he shook out the sand before packing it up.",
  },
];
