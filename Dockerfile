FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install && npm install -g tsx

COPY . .

EXPOSE 3000

CMD ["tsx", "src/api/index.ts"]
