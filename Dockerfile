# Етап 1: збірка. Ставимо всі залежності і компілюємо TypeScript у dist/.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY scheme ./scheme
COPY public ./public
COPY docs/architecture.excalidraw ./docs/architecture.excalidraw
RUN npm run build

# Етап 2: запуск. Тільки production-залежності і готовий dist/. Образ менший.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 3000

# HEALTHCHECK тут свідомо немає: перевірку "живий чи ні" описано один раз, у docker-compose.yml (сервіс app).
# Міграції запускаються при старті застосунку (migrationsRun: true).

CMD ["node", "dist/main.js"]
