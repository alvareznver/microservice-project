FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD npm run health || exit 1

# Comando para iniciar
CMD ["npm", "start"]
