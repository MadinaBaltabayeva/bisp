#!/bin/sh
set -e

echo "Preparing uploads dir on volume..."
mkdir -p /data/uploads/listings /data/uploads/avatars

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

if [ ! -f /data/.seeded ]; then
  echo "Seeding database..."
  NODE_OPTIONS="--max-old-space-size=512" npx tsx prisma/seed.ts && touch /data/.seeded
fi

echo "Starting app..."
exec npm start
