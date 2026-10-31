# Етап 1: збірка. Ставимо всі залежності і компілюємо TypeScript у dist/.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Етап 2: запуск. Тільки production-залежності і готовий dist/. Образ менший.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY public ./public

EXPOSE 3000

# Docker сам перевіряє, чи застосунок живий. Міграції запускаються при старті (migrationsRun: true).
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
