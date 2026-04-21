FROM node:22-alpine

LABEL org.opencontainers.image.title="moviepilot-ai-recognizer-gateway" \
      org.opencontainers.image.description="Dockerized MoviePilot AI recognition gateway with direct LLM recognition and TMDB verification" \
      org.opencontainers.image.source="https://github.com/liuyuexi1987/moviepilot-ai-recognizer-gateway" \
      org.opencontainers.image.url="https://github.com/liuyuexi1987/moviepilot-ai-recognizer-gateway" \
      org.opencontainers.image.version="2.1.1" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./

EXPOSE 9000

CMD ["node", "server.js"]
