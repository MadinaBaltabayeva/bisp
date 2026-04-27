#!/bin/sh
set -e

echo "Linking uploads to volume..."
mkdir -p /data/uploads/listings /data/uploads/avatars
rm -rf /app/public/uploads
ln -s /data/uploads /app/public/uploads

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

if [ ! -f /data/.seeded ]; then
  echo "Seeding database..."
  NODE_OPTIONS="--max-old-space-size=512" npx tsx prisma/seed.ts && touch /data/.seeded
fi

echo "Starting app..."
exec npm start
