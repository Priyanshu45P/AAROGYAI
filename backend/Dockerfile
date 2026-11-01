FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy the installed modules so the Prisma CLI is available for prototype setup.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma

EXPOSE 5000

# This MSc prototype uses db push because the supplied archive has no migration history.
# Before production deployment, replace this with reviewed versioned migrations.
CMD ["sh", "-c", "npx prisma db push && node dist/src/server.js"]
