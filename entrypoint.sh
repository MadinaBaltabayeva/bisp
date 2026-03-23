#!/bin/sh

# Run migrations and seed on first startup
if [ ! -f /app/data/dev.db ]; then
  echo "Setting up database..."
  npx prisma migrate dev --name init
  npx tsx prisma/seed.ts
fi

exec npm run dev
