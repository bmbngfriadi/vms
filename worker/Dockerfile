FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat git curl python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

CMD ["node", "src/worker.js"]
