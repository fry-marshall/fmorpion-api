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