FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev

COPY . .

RUN mkdir -p /tmp/ocr

EXPOSE 4000

CMD ["node", "src/app.js"]