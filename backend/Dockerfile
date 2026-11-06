FROM node:20-alpine

# Install OpenSSL for Prisma, libc compatibility, curl, git, and build tools
RUN apk add --no-cache openssl libc6-compat curl git python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Convert line endings to LF if written on Windows
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
