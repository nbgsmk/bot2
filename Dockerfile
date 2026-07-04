FROM --platform=linux/arm/v7 node:20-alpine
LABEL authors="mcu"

 WORKDIR /app

 COPY package*.json ./
 RUN npm ci --omit=dev

 COPY . .

 EXPOSE 3000

 CMD ["npm", "start"]
