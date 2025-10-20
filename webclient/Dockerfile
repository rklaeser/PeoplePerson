# Production Dockerfile for PeoplePerson Frontend (Cloud Run)
# Multi-stage build for React app
FROM --platform=linux/amd64 node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Accept environment as build argument
ARG VITE_APP_ENVIRONMENT=production
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT

# Build the React app
RUN npm run build

# Production stage with simple serve
FROM --platform=linux/amd64 node:20-alpine

# Install serve for static file serving
RUN npm install -g serve

# Copy built app from build stage (Vite outputs to dist/)
COPY --from=build /app/dist /app

# Cloud Run sets the PORT environment variable
EXPOSE 8080

# Start serve (use PORT environment variable, Cloud Run defaults to 8080)
CMD serve -s /app -l tcp://0.0.0.0:${PORT:-8080}
