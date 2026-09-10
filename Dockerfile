# Tipare Mentale — imagine de producție.
#
# Trei etape, ca imaginea finală să nu conțină nici unelte de build, nici
# node_modules întreg: doar serverul autonom generat de Next (`output:
# "standalone"`) și fișierele statice. Rezultatul e de ordinul a 200 MB, nu 1 GB,
# și nu are în el nimic din ce nu rulează.

# ---------------------------------------------------------------- dependențe
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------- build
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabilele NEXT_PUBLIC_* se coc în bundle la build, deci trebuie să existe
# aici, nu doar la rulare.
ARG NEXT_PUBLIC_SITE_URL=https://tiparementale.ro
ARG NEXT_PUBLIC_APP_URL=https://tiparementale.ro
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------- rulare
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Rulăm ca utilizator fără privilegii: o breșă în aplicație nu devine root.
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public

USER app
EXPOSE 3000

CMD ["node", "server.js"]
