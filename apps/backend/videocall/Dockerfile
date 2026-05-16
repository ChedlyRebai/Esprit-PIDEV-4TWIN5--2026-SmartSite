
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# If using TypeScript (safe even if JS project ignores it)
RUN npm run build || true


FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production
ENV PORT=9000

USER app

EXPOSE 9000


# Start app
CMD ["node", "dist/server.js"]