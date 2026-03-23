FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma migrate dev --name init || true
RUN npx tsx prisma/seed.ts || true

EXPOSE 3000

CMD ["npm", "run", "dev"]
