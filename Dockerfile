# FocusPulse — production web build served as a tiny container.
# Use this if you want to run FocusPulse "forever" as a service on a
# server / NAS / Raspberry Pi and access it from any browser on your LAN.
#
# Build:   docker build -t focuspulse .
# Run:     docker run -d --restart=always --name focuspulse -p 8080:80 focuspulse
# Open:    http://localhost:8080

# ---------- Stage 1: build the Vite app ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json bun.lock* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Stage 2: serve with nginx ----------
FROM nginx:alpine AS runner

# SPA fallback so React Router routes work on refresh
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
