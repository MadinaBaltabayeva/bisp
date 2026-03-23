#!/bin/sh

# Ensure data directory exists
mkdir -p /app/data

# Run migrations every startup (safe — skips if already applied)
echo "Running migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

# Seed if no data exists
if [ ! -f /app/data/.seeded ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts && touch /app/data/.seeded
fi

exec npm run dev
