# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN npm i -g pnpm@12
WORKDIR /app

FROM base AS deps
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS build
ENV HUSKY=0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm nuxt prepare && pnpm build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
