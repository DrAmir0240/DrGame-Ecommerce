# GameDr website

This folder contains the GameDr storefront and its local backend: the home page and game catalog, game detail pages, subscriptions, account/profile tools, downloads, and the admin area.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Copy `.env.example` to `.env` and add any service credentials you want to use. Keep `.env` private and out of source control.
4. Start the site with `npm start`. To use port 3500 in PowerShell, run `$env:PORT=3500; npm start`, then open `http://localhost:3500`.

On first startup, the admin area creates a password if `ADMIN_PASSWORD` is not set and writes it to `.env`. Set your own password there before exposing the server beyond your computer.

The site stores its file-backed data in `data/`. It can use PostgreSQL when `DATABASE_URL` is configured. Configure email, SMS, Google sign-in, or other external services in `.env` before enabling those integrations.

## Main areas

- `public/index.html`, `public/pages/index.js`: home page, game shelves, search, categories, and game previews.
- `public/game.html`, `public/pages/game.js`: game pages, details, reactions, wishlist, and download files.
- `public/subscription.html`, `public/pages/subscription.js`: subscription plans and included games.
- `public/profile.html`, `public/pages/profile.js`: account, devices, downloads, wishlist, requests, notifications, and marketer tools.
- `public/admin.html`, `public/pages/admin.js`: catalog, account, subscription, home-page, and weekly earnings administration.
- `app.js`, `admin.js`, `wallet.js`, `weekly-earnings.js`, `requests.js`: server routes and business rules.
- `data/games.json`, `data/covers/`, and other `data/*.json`: catalog records, cover art, descriptions, ratings, screenshots, plans, and site content.
- `styles/` and `scripts/build-styles.js`: source styles and the CSS build command (`npm run build:css`).

The catalog has been restored to 333 games. Download thumbnails and cover derivatives are cached locally to keep repeated page requests lighter; JSON catalog responses also use short-lived server caching and response compression.
