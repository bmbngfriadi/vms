FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat curl git

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm install prisma@5.22.0 --no-save

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY docker-entrypoint.sh ./

RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
