# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RentHub ("Madina") is a peer-to-peer item rental marketplace built with Next.js 16. Users can list items for rent, browse/search listings, request rentals, communicate via messaging, leave reviews, and manage disputes. Supports three locales (en, ru, uz).

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Run all tests:** `npx vitest run`
- **Run single test:** `npx vitest run src/features/listings/__tests__/actions.test.ts`
- **Run tests matching pattern:** `npx vitest run -t "pattern"`
- **Generate Prisma client:** `npx prisma generate`
- **Run migrations:** `npx prisma migrate dev`
- **Seed database:** `npx tsx prisma/seed.ts`
- **Docker:** `docker-compose up --build`

## Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19
- **Database:** SQLite via better-sqlite3 + Prisma 7 (driver adapter: `@prisma/adapter-better-sqlite3`)
- **Auth:** better-auth with email/password + admin plugin
- **i18n:** next-intl (locales: en, ru, uz) — all routes under `src/app/[locale]/`
- **UI:** Radix UI + shadcn/ui + Tailwind CSS 4
- **Forms:** react-hook-form + zod validation
- **AI:** OpenAI API (optional) for listing descriptions, moderation, translations, pricing suggestions
- **Search:** SQLite FTS5 virtual table with BM25 ranking (see `src/lib/search.ts`)
- **Maps:** Leaflet/react-leaflet
- **Charts:** Recharts
- **Testing:** Vitest + jsdom + React Testing Library

### Route Groups
Routes are organized under `src/app/[locale]/` with three route groups:
- `(public)/` — browse listings, view profiles (no auth required)
- `(auth)/` — dashboard, my listings, rentals, messages, favorites, settings, notifications (auth required)
- `(admin)/` — admin dashboard, user management, moderation, disputes (admin role required)

### Feature Module Pattern
Business logic lives in `src/features/{domain}/` with a consistent structure:
- `actions.ts` — Next.js Server Actions (mutations)
- `queries.ts` — Data fetching functions (reads)
- `__tests__/` — Vitest tests for the feature

Domains: admin, analytics, auth, availability, badges, disputes, favorites, listings, messages, notifications, rentals, reviews, seed.

### Key Libraries
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/auth.ts` — better-auth server config
- `src/lib/auth-client.ts` — better-auth client
- `src/lib/search.ts` — FTS5 full-text search (multilingual)
- `src/lib/openai.ts` — OpenAI client singleton (gracefully disabled when no API key)
- `src/lib/validations/` — Zod schemas per domain

### Prisma
- Schema at `prisma/schema.prisma`, generated client output at `src/generated/prisma/`
- Config in `prisma.config.ts` (uses dotenv for DATABASE_URL)
- SQLite database — no separate DB server needed

### Components
- `src/components/ui/` — shadcn/ui primitives
- `src/components/layout/` — app shell, navbar, bottom tab bar, language switcher
- Domain-specific components organized by feature (listings, rentals, messages, admin, etc.)

### Path Alias
`@/` maps to `src/` (configured in tsconfig and vitest.config.ts).
