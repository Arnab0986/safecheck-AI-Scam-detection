FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev

COPY . .

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview:prod"]