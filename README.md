# RentHub — Peer-to-Peer Rental Marketplace

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

## Running Locally (without Docker)

This is the recommended way to run the project for development.

### 1. Prerequisites

- **Node.js 18 or newer** — check with `node -v`. If you don't have it, install from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`.
- **npm** (comes bundled with Node.js)
- **git**

You don't need to install a database separately. The project uses SQLite, which is just a file on disk, and the `better-sqlite3` package ships the engine as part of `npm install`.

### 2. Clone the repository

```bash
git clone https://github.com/MadinaBaltabayeva/bisp.git
cd bisp
```

### 3. Install dependencies

```bash
npm install
```

This also compiles `better-sqlite3` for your machine. On macOS you need Xcode Command Line Tools (`xcode-select --install`). On Linux you need `build-essential` and `python3`. On Windows the install usually works out of the box.

### 4. Create the `.env` file

In the project root, create a file called `.env` with the following content:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
BETTER_AUTH_SECRET="any-long-random-string-here"
BETTER_AUTH_URL="http://localhost:3000"

# optional — only needed for AI features (smart descriptions, price suggestions, translation)
OPENAI_API_KEY="sk-..."

# optional — only needed for the checkout flow
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# optional — only needed if you want email notifications to actually send
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

You can leave the optional variables empty — the app will start and work fine, the related features will just be disabled.

### 5. Set up the database

Generate the Prisma client and create the SQLite database file:

```bash
npx prisma generate
npx prisma migrate dev
```

The first command generates the typed Prisma client into `node_modules`. The second creates `prisma/dev.db` and applies all migrations in `prisma/migrations/`.

### 6. Seed demo data

```bash
npx tsx prisma/seed.ts
```

This creates the demo users, listings, categories, rentals and reviews described below. Re-running it resets the seeded content.

### 7. Start the dev server

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

### Useful local commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open a database GUI in the browser |
| `npx prisma migrate dev` | Apply new migrations |
| `npx prisma migrate reset` | Wipe the database and re-run all migrations + seed |
| `npx tsx prisma/seed.ts` | Re-seed demo data |

### Resetting the database

If you want a clean slate, delete `prisma/dev.db` (and `prisma/dev.db-journal` if it exists), then re-run steps 5 and 6. Or use:

```bash
npx prisma migrate reset
```

which does the same thing in one command.

### Demo accounts

After running the seed script, you can log in with any of these accounts. All of them use the same password: **`password123`**.

| Role | Name | Email |
|------|------|-------|
| Admin | Admin | `admin@renthub.com` |
| User | Sarah Chen | `sarah.chen@example.com` |
| User | Marcus Johnson | `marcus.johnson@example.com` |
| User | Elena Rodriguez | `elena.rodriguez@example.com` |
| User | James O'Connor | `james.oconnor@example.com` |
| User | Priya Patel | `priya.patel@example.com` |
| User | Tom Baker | `tom.baker@example.com` |
| User | Lisa Nakamura | `lisa.nakamura@example.com` |

> The seed script also creates additional random demo users with `@example.com` emails and the same `password123` password. These are used to populate the marketplace with listings, rentals and reviews.

## Run with Docker Compose (optional)

If you do not want to install Node.js on your machine, you can run the whole app with Docker Compose instead.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac, Windows) or Docker Engine + Docker Compose plugin (Linux)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/MadinaBaltabayeva/bisp.git
   cd bisp
   ```

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="file:./prisma/dev.db"
   OPENAI_API_KEY="your-openai-api-key"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

   > The `OPENAI_API_KEY` is optional. The app works without it, AI features will be disabled.

3. Build and start the container:

   ```bash
   docker compose up --build
   ```

   On the first run this will:
   - build the Docker image from the `Dockerfile`
   - install all Node dependencies
   - generate the Prisma client
   - run database migrations
   - seed the database with demo data
   - start the Next.js dev server on port 3000

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Useful Docker commands

| Command | Description |
|---------|-------------|
| `docker compose up` | Start the app (uses cached image) |
| `docker compose up --build` | Rebuild the image and start |
| `docker compose up -d` | Start in the background (detached) |
| `docker compose logs -f app` | Follow the app logs |
| `docker compose down` | Stop and remove the container |
| `docker compose down -v` | Stop and remove the container **and the database volume** (wipes all data) |
| `docker compose exec app sh` | Open a shell inside the running container |

### Notes

- The SQLite database is persisted in a named Docker volume called `db-data`, so your data will survive container restarts.
- If you change dependencies in `package.json`, run `docker compose up --build` to rebuild the image.
- If you want a clean slate (fresh database), run `docker compose down -v` and start again.

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
