FROM node:22-bookworm-slim

WORKDIR /app

# better-sqlite3's bundled prebuilt binary needs glibc >= 2.33 (bookworm has
# 2.36; the older bullseye's 2.31 fails to dlopen it) and Node >= 22. Keep a
# toolchain too in case a future bump ever forces a from-source rebuild.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p data

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
