# --- Stage 1: Build Stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# --- Stage 2: Production Stage ---
FROM nginx:stable-alpine

# Sao chép sản phẩm build từ Stage 1 vào thư mục static của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép file cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cổng mặc định
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
