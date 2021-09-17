FROM node:latest

WORKDIR /app

COPY *.json ./

COPY src ./src

RUN npm install

VOLUME [ "/app/config" ]

CMD [ "npm", "run", "start" ]