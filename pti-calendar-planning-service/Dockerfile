# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
USER nestjs
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/api/v1/planning/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
