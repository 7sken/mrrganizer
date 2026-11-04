FROM node:22-alpine
WORKDIR /app

# Najpierw zależności (lepsze cache'owanie warstw)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Baza SQLite trzymana w wolumenie
RUN mkdir -p /app/data && chown -R node:node /app/data
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/mrrganizer.db

# Nie uruchamiamy aplikacji jako root
USER node
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
