FROM node:20-alpine

WORKDIR /usr/src/TODOAPP/back-end

COPY package.json .

RUN npm install

COPY . .

RUN npm install

CMD ["npm", "start"]
