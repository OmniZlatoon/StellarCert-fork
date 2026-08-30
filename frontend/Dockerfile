# Multi-stage Dockerfile supporting both development and production
# Development: docker build --target development
# Production: docker build (default target)

# Development stage - runs Vite dev server
FROM node:18 AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Vite's default dev port is 5173
EXPOSE 5173

# Start the dev server
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:18 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage - serve static files with nginx
FROM nginx:alpine AS production

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
