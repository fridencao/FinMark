FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3008

CMD ["npm", "run", "dev"]
