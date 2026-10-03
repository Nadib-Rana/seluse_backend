#!/bin/sh
echo "Waiting for database to be ready..."
sleep 5

echo "Deploying Prisma migrations..."
n=0
until [ "$n" -ge 5 ]
do
   npx prisma migrate deploy && break
   n=$((n+1)) 
   echo "Migration failed, retrying in 5 seconds..."
   sleep 5
done

echo "Seeding default data..."
npm run db:seed || echo "Seeding skipped or failed"

echo "Starting application..."
npm run start:prod
