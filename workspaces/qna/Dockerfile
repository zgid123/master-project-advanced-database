# ---------- deps ----------
FROM node:25-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev
RUN npx prisma generate

# ---------- build ----------
FROM node:25-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma client generation
RUN npx prisma generate

# Build
RUN npm run build

# ---------- runtime ----------
FROM node:25-alpine AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

CMD ["npm", "run", "start:migrate:prod"]