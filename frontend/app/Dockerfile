# syntax=docker/dockerfile:1
# IOMP Frontend (Vite React) built and served via Nginx

ARG NODE_VERSION=18
ARG VITE_API_BASE=http://localhost:8000

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY components.json ./
COPY index.html ./
COPY src ./src

# Pass Vite env at build time
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm ci --no-audit --silent \
    && npm run build

FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=build /usr/src/app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
