FROM node:22-slim

WORKDIR /app

COPY package.json ./

COPY src/ ./src
COPY public/ ./public

RUN npm install

CMD ["npm", "start"]

