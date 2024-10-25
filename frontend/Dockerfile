FROM node:22-slim

WORKDIR /app

COPY package.json ./

COPY src/ ./src
COPY public/ ./public
COPY components.json ./
COPY index.html ./
COPY *.js ./
COPY tsconfig.app.json ./
COPY tsconfig.json ./

RUN npm install

EXPOSE 5173

CMD ["npm", "start",  "--", "--host", "0.0.0.0"]

