# --- deps: install all dependencies (needed to build) ---
FROM node:20-alpine AS deps
WORKDIR /app
# `npm ci` runs the postinstall (`prisma generate`) script, which needs
# prisma/schema.prisma and prisma.config.ts, plus a DATABASE_URL. The real
# value is only needed at runtime (supplied by docker-compose); this
# placeholder just satisfies prisma.config.ts during the build.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# --- build: compile TypeScript ---
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# --- prod-deps: dependencies only, no dev tooling (jest, eslint, etc.) —
# keeps the runtime image free of test/lint tooling and its own nested,
# sometimes-deprecated transitive dependencies (e.g. an old glob under
# jest's coverage instrumentation). `prisma`/`ts-node`/`typescript` are
# real `dependencies` (not dev) since migrate/seed need them at runtime.
FROM node:20-alpine AS prod-deps
WORKDIR /app
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev

# --- runtime: production image ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/package*.json ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
