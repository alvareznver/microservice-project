FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD npm run health || exit 1

CMD ["npm", "start"]
