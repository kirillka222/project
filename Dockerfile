# Этап 1 — сборка
FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm ci
COPY . .
RUN npm run build

# Этап 2 — сервер nginx
FROM nginx:alpine

# Удаляем дефолтные файлы nginx и копируем билд
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфиг nginx (необязательно)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
