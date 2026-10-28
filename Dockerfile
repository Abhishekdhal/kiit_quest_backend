# ==============================================================================
# KIIT QUEST — Node.js Express Gateway Backend
# ==============================================================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

ENV PORT=5000 \
    NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
