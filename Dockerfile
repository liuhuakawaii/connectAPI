FROM node:18 AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

RUN find ./build -name '*.map' -type f -delete

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache bash

RUN rm -rf ./*
COPY --from=builder /app/build .
COPY nginx.conf /etc/nginx/nginx.conf
COPY env.sh .
COPY .env .

RUN chmod +x env.sh

CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]
