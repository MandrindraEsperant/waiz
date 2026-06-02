# Étape 1 : Build de production
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Variables injectées au build (valeurs par défaut pour le dev local)
ARG VITE_API_URL=http://46.225.84.117:8000
ARG REACT_APP_FACEBOOK_APP_ID=1536222442423523
ARG REACT_APP_FACEBOOK_ACCESS_TOKEN=EAAV1L8vOmrsBP1P3u5OHF2Bh6sZCvZAGZOrRiLzOF

ENV VITE_API_URL=$VITE_API_URL
ENV REACT_APP_FACEBOOK_APP_ID=$REACT_APP_FACEBOOK_APP_ID
ENV REACT_APP_FACEBOOK_ACCESS_TOKEN=$REACT_APP_FACEBOOK_ACCESS_TOKEN

# Désactiver les source maps et limiter la mémoire pour éviter le OOM dans Kaniko
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max_old_space_size=512

RUN npm run build

# Étape 2 : Servir avec nginx
FROM nginx:alpine

# Copie de la config nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers buildés
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
