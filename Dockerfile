FROM node:latest

COPY *.json ./

COPY src ./src

COPY config ./config

RUN npm install

RUN npm run build

WORKDIR /dist

VOLUME [ "/dist/config" ]

CMD [ "npm", "run", "start" ]