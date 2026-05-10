FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY workspaces/recsys/package.json workspaces/recsys/package.json
RUN pnpm install --filter recsys --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/workspaces/recsys/node_modules ./workspaces/recsys/node_modules
COPY . .
RUN pnpm --filter recsys build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/workspaces/recsys/node_modules ./workspaces/recsys/node_modules
COPY --from=build /app/workspaces/recsys/package.json ./workspaces/recsys/package.json
COPY --from=build /app/workspaces/recsys/dist ./workspaces/recsys/dist
CMD ["pnpm", "--filter", "recsys", "start"]
