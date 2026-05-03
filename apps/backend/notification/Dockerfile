
FROM node:20-bullseye-slim AS builder
WORKDIR /app

RUN groupadd -r app && useradd -r -g app -u 1001 app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build --silent

RUN npm prune --production

RUN chown -R 1001:1001 /app

FROM gcr.io/distroless/nodejs20-debian11
WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production

USER 1001

EXPOSE 3004

CMD ["dist/main.js"]

