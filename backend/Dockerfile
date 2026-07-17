# Sử dụng Node.js LTS Alpine làm ảnh nền
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép tệp package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies cho production
RUN npm install --omit=dev

# Sao chép toàn bộ mã nguồn
COPY . .

# Khai báo cổng hoạt động
EXPOSE 3000

# Lệnh chạy ứng dụng
CMD ["node", "src/App.js"]
