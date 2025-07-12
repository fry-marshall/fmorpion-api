FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# === Development ===
FROM base AS dev
WORKDIR /app
COPY . .

# === Production ===
FROM node:22-alpine AS prod
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm install -g @nestjs/cli
RUN npx typeorm migration:generate -d src/data-source.ts src/migrations/migration_name

RUN npm run build

CMD ["npm", "run", "start:migrate"]