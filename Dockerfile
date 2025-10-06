# Imagen base oficial de Node
FROM node:18

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (solo producción)
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Exponer el puerto esperado por Cloud Run
EXPOSE 3000

# Comando para correr la app
CMD ["node", "src/server.js"]
