FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Vite bakes these in at build time. Railway passes service variables as build args.
# VITE_API_URL must be the backend public URL + /api (serve has no proxy).
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD sh -c "serve -s dist -l ${PORT:-3000}"
