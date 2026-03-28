# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ESP32-CAM IP is baked into the JS bundle at build time
ARG VITE_ESP32_CAM_IP=172.20.10.2
ENV VITE_ESP32_CAM_IP=$VITE_ESP32_CAM_IP

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
