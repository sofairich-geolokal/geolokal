FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

<<<<<<< HEAD
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
=======
# FIX: Copy all your local code into the container
COPY . .

# Expose the port your app uses (usually 3000 for Node/Next.js)
EXPOSE 3000

# Start your app in development mode
CMD ["npm", "run", "dev"]
>>>>>>> ff7586a34d9dea45a960b302b8c934d64be82def
