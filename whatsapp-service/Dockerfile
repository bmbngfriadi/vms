FROM node:20-alpine

RUN apk add --no-cache git curl python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Ensure Baileys session folder exists
RUN mkdir -p /app/baileys_auth

EXPOSE 5001

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

CMD ["node", "src/server.js"]

