#!/bin/sh
echo "Deploying Prisma migrations..."
npx prisma migrate deploy

echo "Starting application..."
npm run start:prod
