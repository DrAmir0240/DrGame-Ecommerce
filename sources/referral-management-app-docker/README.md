# Branch Ledger

A self-contained subscription referral and Save Box manager. Open `index.html` in a modern browser to use it. No installation or network connection is required.

Use the **فارسی** button in the header to switch the entire interface to Persian with right-to-left layout. The language choice is saved in this browser; use **English** to switch back.

Open **How it works** in the sidebar for a bilingual in-app explanation, a live Bronze example based on the current settings, subscription eligibility rules, and the Save Box discount requirements. The full bilingual proposal is in [SYSTEM-PROPOSAL.md](./SYSTEM-PROPOSAL.md).

The app opens with an account sign-in screen. Built-in demo access is available with username `demo` and password `demo12345` for a member-only sample panel, or username `admin` and password `admin12345` for the admin view of the same isolated sample workspace. The admin’s **Full network tree** is a box-and-line chart of every account; each member’s panel has a separate chart rooted at their own account and limited to their lower-level referrals. Use **Set up owner login** to create a private login for the real workspace; that owner can view its full tree and set or reset usernames and passwords under **Users → Manage member sign-in**. A signed-in member is restricted to their own panel, lower-level tree, and activity history in the interface. Password verifiers are salted and hashed in this browser and are excluded from exported workspace backups.

These public demo credentials open only an isolated, prefilled sample workspace; they must never be used for real customer or financial records. This sign-in is a local prototype gate, not production-grade account security: the real workspace and local account records still live in the same browser profile. Do not expose this standalone build to other computers or the public internet with real customer data. For a website account page, authenticate users on the website server and proxy the scoped `GET /api/v1/member/{userId}` report using the server-only write key; enforce the logged-in user’s identity on the server. The website should recheck discount eligibility at checkout. See [API-INTEGRATION.md](./API-INTEGRATION.md) for the server-side pattern.

## Default calculation

The default plans are Bronze 700,000, Silver 1,500,000, and Gold 3,000,000. From the amount actually paid after a discount, 79% is recorded as the shop allocation and the full 21% enters the referral waterfall. The Save Box is not deducted first. Starting with the buyer’s direct upline, each user receives half of the amount still remaining: 50% of the original pool, then 25%, then 12.5%, and so on. When the chain reaches the CEO row, the remaining amount is split equally between the CEO / Shop Owner Pocket and the separate Save Box. The buyer earns no commission on their own sale.

For example, a full-price Bronze sale of 700,000 allocates 553,000 to the shop and 147,000 to the referral pool. With two user uplines, the direct upline receives 73,500 and the next upline receives 36,750. The remaining 36,750 is split into 18,375 for the CEO and 18,375 for the Save Box. The Save Box contribution therefore varies with the number of user uplines. If an upline’s subscription is inactive, that person’s calculated share goes to the CEO instead; the waterfall still advances to the next upline.

The first-purchase discount defaults to 5%. The discount must be affordable from the existing Save Box balance while leaving the configured reserve intact. Its budget is also capped using the mixed-plan rule: the total discount cost cannot exceed the campaign’s remaining reserve-funded budget. The sale’s new Save Box contribution cannot qualify its own discount.

## Subscription eligibility

Every employee and customer is a user. A paid subscription activates that user for one calendar month by default (configurable from 1 to 24 months). A renewal before expiration extends from the current expiry; a renewal after expiration starts on its payment date, so the uncovered gap stays inactive. For each paid sale, each upline share is checked separately: active users receive their normal share, while an inactive user’s share is credited directly to the CEO / Shop Owner Pocket. These shares are not redistributed to other uplines and are not back-paid if the user later renews. The CEO is exempt from subscription requirements.

## Use and data

- Add users with an Employee or Customer type. The CEO is the separate Shop Owner/root, not a user in the referral network. Employees sit directly under the CEO; customers can be under an employee or customer, or have no inviter.
- Record or renew any user’s subscription as pending or paid. A user must have an active subscription at the time a lower-level sale is paid to receive that commission. Commissions and allocations post only when paid; refunds create reversing ledger entries.
- View the unlimited-depth referral tree, sales breakdowns by plan, buyer level, and paid date, Save Box history, and the full ledger.
- Update plan prices and allocation settings. Currency precision is configurable before sales or ledger entries exist, then locked to preserve historical amounts.
- Export a JSON backup from the top bar or Settings. Import it on another computer to move the workspace.

The standalone workspace stores records in this browser’s local storage. The website API stores website-synced users, sales, referral-tree data, commissions, and ledger entries in a private JSON file outside the public app folder. The API does not process payments; your website must verify a payment before sending its sale event. The 79% shop allocation is before fees, taxes, or overhead and is not net profit.

## Website API

Run npm start with Node.js 20 or newer to launch the optional website integration API. The Website API page connects with a read-only key and displays website sales, commission reports, and the live referral tree. The website submits synced users and confirmed sales using a separate write key. See API-INTEGRATION.md for endpoint details, deployment settings, and example requests. API credentials and its JSON database are stored outside this public app folder.

## Run with Docker

The Docker package runs the web interface and website API as separate containers. Install Docker Desktop with Docker Compose, then open a terminal in this folder and run:

```sh
docker compose up --build -d
```

Open the app at `http://127.0.0.1:8766`. The API is available at `http://127.0.0.1:8787`; its health endpoint is `http://127.0.0.1:8787/api/v1/health`. The demo sign-ins remain `demo` / `demo12345` and `admin` / `admin12345`.

API credentials and API records are saved in the Docker volume `branch-ledger-data`, so they remain available after the containers are stopped or rebuilt. To inspect the generated API keys locally, run `docker compose exec api cat /data/private/.env`; use the read key in the app’s Website API connection and keep the write key on the website server. Stop the containers with `docker compose down`. If port 8766 is already in use, set `WEB_PORT=8767` in a `.env` file in this folder before starting; the API CORS setting follows that port.

The web image contains the static app files, while the API image runs `server.js`. Docker build context excludes Git metadata, local API data, environment files, and archives.
