# Dr Game: load test and PostgreSQL migration

Date: 2026-10-06. Machine: Windows 10, 12 logical CPUs, Node 24, PostgreSQL 18 (local).
Load generator: autocannon on the SAME machine, so the test and the site shared the CPU (real servers do better).
Every request used a different visitor address (as Cloudflare would pass on), so the per-visitor rate limits did not distort results.
"1000 users" = 1000 simultaneous connections, each sending the next request as soon as the last one finished (much harder than 1000 real people, who pause to read).

## What was found (before)

| Part | Result with 1000 at once (JSON files, old code) |
|---|---|
| Game list `/api/games` | **Broke.** 46 requests/s, half of visitors waited 5 s, the slowest 10 s. At 5000 connections 73,000 connections were dropped. |
| Home strip `/api/featured` | 641 req/s, 1.5 s per request; at 5000 connections 16,000 dropped connections. |
| Log in `/api/account/login` | **Broke.** 38 req/s, 5-10 s per log-in. Password hashing froze the whole server while it ran. |
| A normal browsing session (home, categories, featured, game list, game page, track) | 410 req/s, 4,865 dropped connections, slowest 21 s. **The site would have been unusable.** |
| Everything else (static pages, small API calls, writes) | Survived (2,000-20,000 req/s) |

Why: every request re-scanned the disk for all 331 games, every log-in used the blocking password hash, and each request
parsed whole data files.

## What was changed

1. **PostgreSQL storage** (`store.js`, set `DATABASE_URL`). Data is held in memory and saved to the database in the background
   (batched). Lists of records with an id (accounts, orders, purchases, wallet entries, requests) are one row each and only changed
   rows are written; the rest are jsonb documents. Without `DATABASE_URL` the site still uses the JSON files, now with the same memory layer.
2. **Catalog cache**: game list, featured, categories, platforms and file lists are built once and shared for 3 s (cleared immediately when
   the admin changes games or files). Cover lookups are cached.
3. **Password hashing moved off the main thread** (thread pool, at most CPUs-1 at once).
4. **Account lookups by id use an index**, and `/api/track` / log-in time update one account instead of copying all accounts.
5. `/healthz` shows the store mode, pending saves and the last error.

## Results after (PostgreSQL, 1000 simultaneous connections, 10 s each, 50,000 accounts in the database)

| Test | Before req/s | After req/s | Before median / slowest-1% | After median / slowest-1% |
|---|---|---|---|---|
| Home page (static) | 16,100 | 13,600 | 60 / 89 ms | 72 / 95 ms |
| GET /api/games | **45** | **6,950** | 5,081 / 9,950 ms | 140 / 170 ms |
| GET /api/featured | 641 | 21,700 | 1,545 / 1,600 ms | 45 / 54 ms |
| GET /api/categories | 19,970 | 22,900 | 49 / 61 ms | 43 / 53 ms |
| GET /api/games/:slug/files | 5,005 | 15,650 | 198 / 218 ms | 63 / 74 ms |
| GET /api/site-content | 10,104 | 13,300 | 98 / 118 ms | 74 / 84 ms |
| GET /api/for-you | 2,128 | 5,570 | 465 / 482 ms | 178 / 188 ms |
| GET /api/account/me (logged in) | 7,706 | 18,100 | 128 / 144 ms | 54 / 63 ms |
| POST /api/track (a write) | 2,247 | 17,160 | 438 / 475 ms | 57 / 64 ms |
| POST /api/account/login | **38** | 196 | 5,067 / 10,001 ms | 4,565 / 5,597 ms |
| POST /api/requests (a write) | 2,202 | 11,180 | 445 / 512 ms | 102 / 123 ms |
| POST /api/download-link | 6,981 | 7,190 | 142 / 177 ms | 138 / 148 ms |
| GET /dl/<token> (20 MB file) | 13 (267 MB/s) | 13 (267 MB/s) | disk/network limit | disk/network limit |

Mixed "browse session" (9 requests per visitor, 1000 visitors for 30 s):
before 410 req/s, 4,865 dropped connections, slowest 21 s; **after 12,480 req/s, 0 errors, median 64 ms, slowest 1% 171 ms.**

Pushing harder (after): `/api/featured` with 2,000 and 5,000 simultaneous connections: about 21,000 req/s, 0 errors
(median 93 ms and 233 ms). `/api/games` (80 KB each): about 7,000 req/s, 0 errors, median 280 ms at 2,000 and 709 ms at 5,000.
Nothing crashed or returned an error in any "after" run.

Data safety checks: after about 176,000 concurrent write requests the view counter saved in PostgreSQL read 177,394 (in line with what was sent); after a restart accounts, passwords
and history were all still there; a wrong password still returns 401.

## What is still the weak spot

* **Log-in / sign-up** is limited by the CPU cost of password hashing (about 200 per second on this 12-core PC; roughly 20 per second
  on a small 1-2 core server). 1000 people logging in the same second would wait about 5 s each; nobody fails. Spread over a minute it is nothing.
* **One server process.** Node uses one CPU core for the site's logic. Measured limit here: roughly 7,000-22,000 requests per second,
  depending on the page. Sessions (logged-in browsers) are kept in memory, so a restart logs everyone out, and you must run only ONE copy of
  the site per database (two copies would overwrite each other's changes).
* **Whole-list operations** (new sign-ups, buying, admin edits) copy the entire list of accounts. At 50,000 accounts that is still fine
  (tens of ms); at several hundred thousand accounts these paths need real per-row database queries.
* **Large downloads** are limited by your disk, your network and your hosting plan, not by the code (here 267 MB/s locally).
  1000 people downloading a 5 GB file at the same time needs a fast connection (or a CDN / object storage), whatever the software does.
* **Cloudflare**: the free plan caches pages and absorbs attacks, but its terms restrict serving big video/file downloads through the proxy.
* My test had few uploaded files. A game with 50+ files makes `/api/games/:slug/files` heavier (still cached 3 s).
* Nothing here tested your real internet connection, the PlayStation Store lookup, sending e-mail / SMS, or Telegram.

## How to repeat it

Start the site with `TRUSTED_PROXY=cloudflare` (so every test visitor gets a different address) on a COPY of the data, then run autocannon
against the URLs above, e.g. `npx autocannon -c 1000 -d 10 http://localhost:3500/api/featured`.

## Page loading speed (second round)

Nothing was redesigned; the same pages and pictures are sent in a lighter form.
Home page, first visit, everything it loads (page, scripts, styles, data, logo, coin, 22 game covers):

| | Before | After |
|---|---|---|
| Total download | about 9,400 KB | about 720 KB (13 times less) |
| Covers (22 tiles) | 8,900 KB | 650 KB |
| Scripts, styles, page, data | 500 KB | 70 KB |
| Files from other websites | Google Fonts (blocked rendering) | none |

What changed:
1. Text (pages, scripts, styles, JSON) is sent compressed. For example `/api/games` 82 KB -> 8 KB, `style.css` 61 KB -> 12 KB.
2. Game covers on the home / All Games / game pages are requested as small WebP copies (`/covers/name.jpg?w=400`), made once and kept in
   `data/cover-cache`. The original files and their address still work exactly as before. A 173 KB cover became 11 KB.
3. `logo.png` 151 KB -> 11 KB and `coin.svg` 204 KB -> 15 KB (they were 640 px pictures shown at 40-140 px). Originals are in `scripts/originals/`.
4. The Persian font (Vazirmatn) is now served from the site itself (`/fonts`) instead of Google Fonts, which is slow or blocked in some
   places; it is only downloaded when a page is shown in Persian.
5. Browsers keep fonts for a year, pictures for a day, scripts/styles for 5 minutes; pages always check for changes.
6. Covers load with `decoding="async"` (they were already lazy).
