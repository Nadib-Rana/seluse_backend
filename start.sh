#!/bin/sh
echo "Waiting for database to be ready..."
sleep 5

echo "Database is ready."

echo "Seeding default data..."
npm run db:seed || echo "Seeding skipped or failed"

echo "Starting application..."
npm run start:prod
