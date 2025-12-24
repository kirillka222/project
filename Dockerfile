# Этап 1 — сборка
FROM node:20-alpine as build

WORKDIR /app

# 1. Копируем файлы зависимостей
COPY package.json package-lock.json ./

# 2. Устанавливаем с legacy-peer-deps для React 19
RUN npm ci --legacy-peer-deps

# 3. Копируем остальной код
COPY . .

# 4. Собираем приложение
RUN npm run build

# Этап 2 — сервер nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]