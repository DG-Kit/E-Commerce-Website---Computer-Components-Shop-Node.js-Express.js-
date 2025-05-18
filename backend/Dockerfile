# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/public ./public
RUN npm install --only=production
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
