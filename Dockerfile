# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production Stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (we need devDependencies for ts-node seeding)
RUN npm install

# Copy Prisma schema and generate client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Set permissions
USER node

# Expose ports
EXPOSE 3000
EXPOSE 8443

# Start the application with migrations
CMD ["./start.sh"]