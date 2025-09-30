# Build stage (TypeScript compilation)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage (runtime)
FROM node:20-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app ./

EXPOSE 80
CMD ["npm", "start"]