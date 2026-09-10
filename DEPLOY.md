# Punere în producție

Serverul: Hetzner, `178.104.20.127`, aplicația pe portul **3007**. Baza de date
e cea partajată de pe același server; aplicația se conectează cu rolul
`tipare_mentale_app`, limitat la schema proiectului.

## O singură dată, pe server

```bash
# Docker (dacă lipsește)
curl -fsSL https://get.docker.com | sh

# Codul
git clone https://github.com/ddobroiu/tiparementale.git /opt/tiparementale
cd /opt/tiparementale

# Secretele — NU în depozit. Copiază din .env.example și completează.
cp .env.example .env
nano .env
```

În `.env`, pe server:

| Cheie | Valoare |
|---|---|
| `DATABASE_URL` | rolul `tipare_mentale_app` — ia-l din `.env.local` de pe calculatorul tău |
| `DATABASE_URL_ADMIN` | doar pentru migrări; poate lipsi din containerul de rulare |
| `ANTHROPIC_API_KEY` | cheie **separată** de cea de dezvoltare, cu limită de cheltuială în Console |
| `STRIPE_SECRET_KEY` | `sk_live_…` când treci pe plăți reale |
| `STRIPE_WEBHOOK_SECRET` | din Stripe → Developers → Webhooks, pentru `https://tiparementale.ro/api/stripe/webhook` |
| `NEXT_PUBLIC_SITE_URL` | `https://tiparementale.ro` |
| `NEXT_PUBLIC_APP_URL` | `https://tiparementale.ro` |

Pentru că baza e pe același server, `DATABASE_URL` poate folosi `127.0.0.1`
în loc de IP-ul public — dar din container, `127.0.0.1` e containerul însuși.
Folosește IP-ul public sau `host.docker.internal` cu `extra_hosts`. Cel mai
simplu: lasă IP-ul public, cum e acum.

## Migrările

Rulează o dată, de pe server, înainte de prima pornire (și după fiecare
migrare nouă):

```bash
cd /opt/tiparementale
docker compose run --rm app node scripts/migrate.mjs
```

Scriptul cere `DATABASE_URL_ADMIN`; dacă nu vrei cheia de admin în `.env`-ul
containerului, rulează migrările de pe calculatorul tău — baza e aceeași.

## Pornire

```bash
docker compose up -d --build
docker compose logs -f app     # până vezi „Ready"
curl -I http://127.0.0.1:3007/intra   # 200
```

## Actualizare

```bash
cd /opt/tiparementale
git pull
docker compose up -d --build
```

Pornirea noului container durează ~20 s; `restart: unless-stopped` îl ridică
și după repornirea serverului.

## Domeniul și HTTPS

Portul 3007 nu e pentru public. În fața lui, un proxy care termină HTTPS —
Caddy e cel mai scurt drum (certificat automat):

```
# /etc/caddy/Caddyfile
tiparementale.ro, www.tiparementale.ro {
    reverse_proxy 127.0.0.1:3007
}
```

Apoi `systemctl reload caddy`. DNS: `A` pentru `tiparementale.ro` și `www` →
`178.104.20.127`.

## Stripe, la lansare

1. În Stripe Dashboard → Developers → Webhooks → Add endpoint:
   `https://tiparementale.ro/api/stripe/webhook`, evenimentul
   `checkout.session.completed`.
2. Copiază `whsec_…` în `.env` → `STRIPE_WEBHOOK_SECRET`.
3. `docker compose up -d` (fără `--build` — doar variabilele s-au schimbat).

Fără webhook, plățile reușesc la Stripe dar **nu creditează** contul.

## Verificări după deploy

- `https://tiparementale.ro/` → 200, `https://…/harta` → 307 spre `/intra`
- `https://…/sitemap.xml` și `/robots.txt` → 200
- un cont nou primește 1 ședință și 0 transformări (`/setari`)
- `node --env-file=.env.local scripts/spend.mjs` de pe calculatorul tău arată
  consumul real după primele conversații
