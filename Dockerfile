FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src/ ./src/
COPY tests/ ./tests/

EXPOSE 5173

# --host 0.0.0.0: el dev server de Vite solo escucha en localhost por default,
# lo que lo hace inalcanzable desde fuera del contenedor.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
