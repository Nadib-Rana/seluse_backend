# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (we need devDependencies for ts-node seeding)
RUN npm ci

# Copy Prisma schema and generate client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Set permissions
USER node

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Expose ports
EXPOSE 3000
EXPOSE 8443

# Start the application with migrations
CMD ["./start.sh"]