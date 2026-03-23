# Madina — Peer-to-Peer Rental Marketplace

A full-stack web application where university students and local communities can list, discover, and rent items from each other. Built as a BISP (Bachelor of Information Systems Project).

## Features

- **Listings** — create, edit, browse, and search rental listings with photo uploads
- **Rentals** — request items, track rental status, manage bookings with calendar and pricing
- **Messaging** — real-time chat between renters and owners
- **Reviews** — rate and review completed rentals
- **Payments & Disputes** — checkout flow and dispute resolution system
- **Admin Panel** — user management, content moderation, dispute handling, analytics dashboard
- **Identity Verification** — ID verification wizard with trust badges
- **Notifications** — in-app and email notifications for rental events
- **AI Features** — smart description generator, price suggestions, cross-language search
- **Internationalization** — full support for English, Russian, and Uzbek
- **Map View** — browse listings on an interactive map (Leaflet)
- **Favorites** — save and manage favorite listings
- **QR Handoff** — QR code generation for rental pickup/return

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (via better-sqlite3) with Prisma 7 ORM
- **Auth:** Better Auth
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI
- **Maps:** Leaflet / React Leaflet
- **AI:** OpenAI API
- **i18n:** next-intl
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Testing:** Vitest + Testing Library
- **Email:** Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# clone the repo
git clone https://github.com/MadinaBaltabayeva/bisp.git
cd bisp

# install dependencies
npm install

# generate Prisma client
npx prisma generate
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

> The `OPENAI_API_KEY` is only needed for AI features (description generation, price suggestions, translation). The app works without it.

### Database Setup

```bash
# create the database and run migrations
npx prisma migrate dev

# seed with demo data
npx tsx prisma/seed.ts
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/[locale]/        # pages grouped by route
│   ├── (admin)/         # admin panel pages
│   ├── (auth)/          # login, signup
│   └── (public)/        # listings, rentals, messages, profile
├── components/          # reusable UI components
├── lib/                 # database, auth, openai, utilities
├── actions/             # server actions (CRUD operations)
├── queries/             # database query functions
└── i18n/                # internationalization config
prisma/
├── schema.prisma        # database schema
└── seed.ts              # seed script with demo data
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open database GUI |
| `npx prisma migrate dev` | Run database migrations |
