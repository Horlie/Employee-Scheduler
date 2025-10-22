# Stage 1: Build
FROM node:20-bullseye AS build
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy project
COPY . .

# Build frontend & generate Prisma client
RUN pnpm run vercel-build

# Stage 2: Production
FROM node:20-bullseye
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=build /app ./

EXPOSE 3000

# Run migrations then start
CMD sh -c "npx prisma migrate deploy && pnpm run start"
