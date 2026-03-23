# Imagen de producción — API Express
FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production

# Solo dependencias de producción (instalación reproducible)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node

EXPOSE 3000

# Arranque directo (sin script npm para evitar capas extra)
CMD ["node", "src/index.js"]
