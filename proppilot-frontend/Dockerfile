FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=https://backend-production-1752.up.railway.app
ENV VITE_GOOGLE_CLIENT_ID=686454629506-d068i9m0tm2nvue7rdbjfgpm3ivvmggb.apps.googleusercontent.com
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD sh -c "serve -s dist -l ${PORT:-3000}"
