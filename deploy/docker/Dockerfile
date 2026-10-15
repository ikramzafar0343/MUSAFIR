# MUSAFIR — production image (Frontend + Backend targets)
FROM node:20.19-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ---------- Backend ----------
FROM base AS backend-deps
WORKDIR /app/Backend
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev

FROM base AS backend
WORKDIR /app/Backend
# System ffmpeg is more reliable in Docker; npm ffmpeg-static remains as fallback.
# Sharp ships a prebuilt libvips binary (@img/sharp-*) — no system libvips required.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*
COPY --from=backend-deps /app/Backend/node_modules ./node_modules
COPY Backend ./
COPY Database /app/Database
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "run", "start"]

# ---------- Frontend ----------
FROM base AS frontend-deps
WORKDIR /app/Frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci

FROM base AS frontend-build
WORKDIR /app/Frontend
COPY --from=frontend-deps /app/Frontend/node_modules ./node_modules
COPY Frontend ./
ARG APP_URL=https://musafir.com
ENV NODE_ENV=production \
    APP_URL=${APP_URL} \
    API_URL=http://musafir-backend-1:5000 \
    API_PREFIX=/api/v1 \
    HMAC_SIGNING_SECRET=build-placeholder-hmac-signing-secret-32chars-min \
    SESSION_SECRET=build-placeholder-session-secret-value-32chars-min \
    SESSION_TTL_SECONDS=604800
RUN npm run build

FROM base AS frontend
WORKDIR /app/Frontend
ENV NODE_ENV=production
COPY --from=frontend-build /app/Frontend ./
EXPOSE 3020
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3020"]
