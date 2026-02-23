FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY patches/ ./patches/
COPY packages/blackwall/package.json ./packages/blackwall/
COPY packages/backend/package.json ./packages/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/email/package.json ./packages/email/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/queue/package.json ./packages/queue/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

COPY packages/ ./packages/

RUN bun run build


FROM oven/bun:1-slim AS runtime

WORKDIR /app

COPY --from=builder /app/packages/blackwall/dist/blackwall ./blackwall
COPY --from=builder /app/packages/blackwall/dist/public ./public
COPY --from=builder /app/packages/blackwall/dist/migrations ./migrations

RUN mkdir -p blackwall_data

EXPOSE 8000

ENTRYPOINT ["./blackwall"]
CMD ["serve", "--port", "8000", "--public-dir", "./public"]
