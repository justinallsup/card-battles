FROM node:22-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

EXPOSE 8000
CMD ["node", "dist/index.js"]
