#!/bin/sh

# Run migrations every startup (safe — skips if already applied)
echo "Running migrations..."
npx prisma migrate deploy

# Seed if not already seeded
if [ ! -f /app/prisma/.seeded ]; then
  echo "Seeding database..."
  NODE_OPTIONS="--max-old-space-size=512" npx tsx prisma/seed.ts && touch /app/prisma/.seeded
fi

exec npm run dev
