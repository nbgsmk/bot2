FROM node:26-alpine
LABEL authors="mcu"

 WORKDIR /app

 COPY package*.json ./
 RUN npm ci --only=production

 COPY . .

 EXPOSE 3000

 CMD ["npm", "start"]
