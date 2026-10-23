# Branch Ledger website API

This API receives account and paid-subscription events from a shop website. It calculates the existing Branch Ledger allocation rules, keeps an append-only financial ledger, and provides reporting endpoints for the management dashboard.

## Start the API

1. Install Node.js 20 or newer on the server.
2. In this folder, run npm start (or node server.js).
3. On first start, the API generates separate random read and write keys in the private file ../.branch-ledger-api/.env. The private folder and its JSON database are outside the public app folder.
4. Copy API_READ_TOKEN to the internal Branch Ledger dashboard. Keep API_WRITE_TOKEN on the website server only.
5. By default, the API listens only on 127.0.0.1:8787. For a hosted website, set HOST=0.0.0.0, put the API behind HTTPS, and set ALLOWED_ORIGINS to the exact origin of the internal dashboard (comma-separated for more than one). Example: ALLOWED_ORIGINS=https://admin.example.com.

The app dashboard stores the read key in the current browser tab session. It is a sensitive reporting credential because it can read names, sales, the referral tree, and commissions. Use it only in an internal admin dashboard. Never place the write key in website JavaScript, a mobile app, a public repository, or a public page.

## Authentication

Send API keys as a bearer token:

    Authorization: Bearer YOUR_API_KEY

The read key can call GET endpoints. The write key can call GET, POST, and PUT endpoints. Requests from browsers must come from an origin listed in ALLOWED_ORIGINS; CORS is not a substitute for API authentication. Server-to-server website calls do not use browser CORS.

## Read endpoints

All reads except health require a read or write key.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/v1/health | Public process health |
| GET | /api/v1/dashboard | Combined overview, plans, sales, commissions, and referral tree |
| GET | /api/v1/stats | Revenue and sales totals grouped by plan, buyer level, and date |
| GET | /api/v1/tree | Full hierarchy with subscription status and per-user metrics |
| GET | /api/v1/commissions | Net commission totals by user and recent commission entries |
| GET | /api/v1/users | Synced employee and customer accounts |
| GET | /api/v1/sales | Sale history; optional ?status=paid or ?status=refunded |
| GET | /api/v1/plans | Current plan IDs, prices, and currency settings |
| GET | /api/v1/settings | Current commission, discount, subscription, currency, and plan settings |
| GET | /api/v1/discount-quote?buyerId=USER_ID&planId=bronze | Check first-purchase Save Box discount eligibility before checkout |
| GET | /api/v1/ledger | Append-only allocation ledger |

### Member account report

GET /api/v1/member/{userId} returns one member’s account summary, subscription state and history, lower referral tree, commission balance, commission statement, commissions routed to the CEO while the member was inactive, and the member’s current first-purchase discount quotes. The response excludes company-wide totals and internal user IDs for people in the member’s team. Discount quotes are provisional; the website must recheck eligibility at checkout before accepting payment.

This route requires API_WRITE_TOKEN and is intended for server-to-server use. The website must first authenticate the member using its own sign-in system, then request this route using the user ID from that verified session. Do not send API_WRITE_TOKEN to browser code or let a browser choose an arbitrary user ID. The website should return only the response for the signed-in account.

Example website server route:

    // req.user must come from the website's verified login session.
    const memberId = req.user.branchLedgerUserId;
    const response = await fetch(
      process.env.BRANCH_LEDGER_API_URL + "/api/v1/member/" + encodeURIComponent(memberId),
      { headers: { Authorization: "Bearer " + process.env.BRANCH_LEDGER_API_WRITE_TOKEN } }
    );
    const memberReport = await response.json();
    res.status(response.status).json(memberReport);

The Member panel inside this app is an owner preview for locally stored records. It is useful for reviewing what the member report contains, but it does not authenticate individual users. Use the website’s authenticated account page to show personal data to members.

## Write endpoints

Every POST or PUT write requires API_WRITE_TOKEN and a JSON body with Content-Type: application/json.

### Update plan and allocation settings

Use the write key to update settings for future sales. Posted allocations keep their saved historical calculations. Currency precision locks after a financial record exists.

PUT /api/v1/settings

    {
      "shopRate": 79,
      "referralRate": 21,
      "welcomeRate": 5,
      "reserveRate": 50,
      "subscriptionMonths": 1,
      "currencyPrecision": 0,
      "currencyLabel": "toman",
      "plans": [
        { "id": "bronze", "name": "Bronze", "price": 700000 },
        { "id": "silver", "name": "Silver", "price": 1500000 },
        { "id": "gold", "name": "Gold", "price": 3000000 }
      ]
    }

### Sync a user

Call after the website creates an employee or customer, before recording their sale. Use a stable ID from the website. Repeating the same request is safe; reusing an ID with different details returns 409 user_conflict.

POST /api/v1/users

    {
      "id": "site-user-1042",
      "name": "Ava Customer",
      "role": "customer",
      "referrerId": "site-user-900"
    }

role is employee or customer. Employees are placed directly under the Shop Owner (ID owner). A customer may be referred by an employee/customer, or use null for a shop sale with no inviter.

### Record a paid subscription

Call only after the payment provider confirms the payment. Send amounts as non-negative integer currency units (the default plans are 700000, 1500000, and 3000000). amountPaid is the actual amount collected after any discount. The API uses it as the commission basis. Configure the same currency precision and unit used by the website.

POST /api/v1/sales

    {
      "externalSaleId": "order-2026-00481",
      "buyerId": "site-user-1042",
      "planId": "bronze",
      "amountPaid": 700000,
      "paidAt": "2026-10-21T09:30:00.000Z"
    }

The externalSaleId must be unique and stable. Re-sending the same sale is idempotent; changing its buyer, plan, or amount returns 409 sale_id_conflict. You may also send the same value in the Idempotency-Key header. Send payment events in the order they were confirmed when possible.

For a Save Box welcome discount, first call the quote endpoint. If eligible, include listPrice, the exact quoted saveBoxDiscountAmount, and discountSource: "savebox_welcome"; amountPaid must equal listPrice minus saveBoxDiscountAmount. The API rechecks eligibility during sale posting so the same Save Box money cannot fund multiple simultaneous discounts. Other website promotions should only reduce amountPaid; they do not debit the Save Box.

### Refund a sale

Call after the website confirms a refund:

POST /api/v1/sales/order-2026-00481/refund

No body is required. The API adds reversal ledger entries, marks the sale refunded, and updates the buyer's subscription expiry. Repeating a refund request does not add a second reversal.

## Allocation rules

The default sale allocation is 79% shop and 21% referral pool, calculated from the amount actually paid. The buyer does not receive commission on their own purchase. Starting with the buyer's direct inviter, each user upline receives half of the pool still remaining: 50%, then 25%, 12.5%, and so on. At the CEO row, the remaining amount splits equally between the CEO / Shop Owner Pocket and the Save Box. An upline whose subscription was inactive at sale time has their calculated share routed to the CEO. The API records this calculation with each sale.

A paid subscription activates its buyer for one configured calendar month by default. Employees and customers must be active when a lower-level payment is processed to earn commission. The CEO is exempt. The API does not process card payments; the website remains responsible for checkout, payment verification, and sending confirmed events.

## Example website server call

Keep API_WRITE_TOKEN in the website server's secret manager/environment. Do not call this write endpoint directly from public browser code.

    await fetch(process.env.BRANCH_LEDGER_API_URL + "/api/v1/sales", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.BRANCH_LEDGER_API_WRITE_TOKEN,
        "Content-Type": "application/json",
        "Idempotency-Key": order.id
      },
      body: JSON.stringify({
        externalSaleId: order.id,
        buyerId: customer.branchLedgerUserId,
        planId: order.planId,
        amountPaid: order.amountPaid,
        paidAt: order.paidAt
      })
    });

## Operational notes

- The API database and credentials are stored outside this folder so a static web server cannot serve them as public files.
- Back up the private ../.branch-ledger-api/branch-ledger.json file regularly. Keep the .env file separately protected.
- The sample server binds to localhost. Exposing it to a website requires a secure host, HTTPS reverse proxy, firewall rules, monitoring, and backups.
- The API is a single-process JSON store intended for an initial integration. Use one running API instance. For high-volume or multi-instance production hosting, move the store to a transactional database and use a managed secrets store.
- Amounts are stored as safe integer currency units. With currency precision set to 0, 700000 means 700,000 of the configured currency.
