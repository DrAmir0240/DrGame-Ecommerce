"use strict";

// Branch Ledger website integration API. Node.js built-ins only.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const APP_DIR = __dirname;
const PRIVATE_DIR = process.env.BRANCH_LEDGER_PRIVATE_DIR
  ? path.resolve(process.env.BRANCH_LEDGER_PRIVATE_DIR)
  : path.resolve(APP_DIR, "..", ".branch-ledger-api");
const ENV_FILE = path.join(PRIVATE_DIR, ".env");
const DATA_FILE = process.env.BRANCH_LEDGER_DATA_PATH
  ? path.resolve(process.env.BRANCH_LEDGER_DATA_PATH)
  : path.join(PRIVATE_DIR, "branch-ledger.json");
const DEFAULT_PLANS = [
  { id: "bronze", name: "Bronze", price: 700000 },
  { id: "silver", name: "Silver", price: 1500000 },
  { id: "gold", name: "Gold", price: 3000000 }
];

function loadEnvFile() {
  return fs.readFile(ENV_FILE, "utf8").then(function (source) {
    source.split(/\r?\n/).forEach(function (line) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match || match[1][0] === "#") return;
      if (process.env[match[1]] == null) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    });
  }).catch(function (error) {
    if (error.code !== "ENOENT") throw error;
  });
}

async function ensureApiKeys() {
  await loadEnvFile();
  if (process.env.API_READ_TOKEN && process.env.API_WRITE_TOKEN) return;
  const readToken = crypto.randomBytes(32).toString("hex");
  const writeToken = crypto.randomBytes(32).toString("hex");
  const existing = await fs.readFile(ENV_FILE, "utf8").catch(function () { return ""; });
  const additions = [
    existing && !existing.endsWith("\n") ? "\n" : "",
    !process.env.API_READ_TOKEN ? "API_READ_TOKEN=" + readToken + "\n" : "",
    !process.env.API_WRITE_TOKEN ? "API_WRITE_TOKEN=" + writeToken + "\n" : ""
  ].join("");
  await fs.mkdir(PRIVATE_DIR, { recursive: true });
  await fs.writeFile(ENV_FILE, existing + additions, { mode: 0o600 });
  if (!process.env.API_READ_TOKEN) process.env.API_READ_TOKEN = readToken;
  if (!process.env.API_WRITE_TOKEN) process.env.API_WRITE_TOKEN = writeToken;
  console.log("Created API credentials in " + ENV_FILE + ". Keep the write key on your website server only.");
}

function blankStore() {
  const now = new Date().toISOString();
  return {
    version: 1,
    settings: {
      shopRate: 79,
      referralRate: 21,
      welcomeRate: 5,
      reserveRate: 50,
      currencyPrecision: 0,
      currencyLabel: "",
      subscriptionMonths: 1,
      plans: DEFAULT_PLANS.map(function (plan) { return Object.assign({}, plan); })
    },
    people: [{ id: "owner", name: "Shop Owner", role: "owner", referrerId: null, createdAt: now }],
    sales: [],
    ledger: []
  };
}

async function loadStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.people) || !Array.isArray(parsed.sales) || !Array.isArray(parsed.ledger) || !parsed.settings) {
      throw new Error("The API data file has an unsupported or invalid structure.");
    }
    if (!parsed.people.some(function (person) { return person.id === "owner" && person.role === "owner"; })) {
      throw new Error("The API data file is missing the Shop Owner root.");
    }
    return parsed;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const initial = blankStore();
    await persistStore(initial);
    return initial;
  }
}

let store;
let writeQueue = Promise.resolve();
async function persistStore(value) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const temporary = DATA_FILE + ".tmp";
  await fs.writeFile(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
  await fs.rename(temporary, DATA_FILE);
}
function withMutation(work) {
  const operation = writeQueue.then(async function () {
    const result = await work();
    await persistStore(store);
    return result;
  });
  writeQueue = operation.catch(function () {});
  return operation;
}

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": data.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(data);
}
function fail(res, status, code, message) {
  json(res, status, { error: { code: code, message: message } });
}
function constantTimeEqual(left, right) {
  if (!left || !right) return false;
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function tokenFrom(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}
function hasReadAccess(req) {
  const token = tokenFrom(req);
  return constantTimeEqual(token, process.env.API_READ_TOKEN) || constantTimeEqual(token, process.env.API_WRITE_TOKEN);
}
function hasWriteAccess(req) {
  return constantTimeEqual(tokenFrom(req), process.env.API_WRITE_TOKEN);
}
function cors(req, res) {
  const origin = String(req.headers.origin || "");
  const allowed = String(process.env.ALLOWED_ORIGINS || "http://127.0.0.1:8766,http://localhost:8766,http://127.0.0.1:8787,http://localhost:8787")
    .split(",").map(function (entry) { return entry.trim(); }).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type,Idempotency-Key");
  res.setHeader("Access-Control-Max-Age", "600");
}
async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      const error = new Error("Request body exceeds the 1 MB limit.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  let value;
  try { value = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch (_) {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const error = new Error("Request body must be a JSON object.");
    error.status = 400;
    throw error;
  }
  return value;
}
function safeText(value, label, maxLength) {
  const text = String(value == null ? "" : value).trim();
  if (!text || text.length > maxLength) throw httpError(400, "invalid_" + label, label + " is required and must be " + maxLength + " characters or fewer.");
  return text;
}
function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
function safeAmount(value, label, allowZero) {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw httpError(400, "invalid_" + label, label + " must be a " + (allowZero ? "non-negative" : "positive") + " safe integer in the configured currency unit.");
  }
  return value;
}
function percent(amount, rate) {
  return Number((BigInt(amount) * BigInt(Math.round(Number(rate) * 10)) + 500n) / 1000n);
}
function personById(id) {
  return store.people.find(function (person) { return person.id === id; }) || null;
}
function planById(id) {
  return store.settings.plans.find(function (plan) { return plan.id === id; }) || null;
}
function paidSalesFor(personId, beforeOrAt) {
  const cutoff = beforeOrAt == null ? Infinity : new Date(beforeOrAt).getTime();
  return store.sales.filter(function (sale) {
    return sale.status === "paid" && sale.customerId === personId && new Date(sale.paidAt).getTime() <= cutoff;
  }).slice().sort(function (a, b) { return new Date(a.paidAt) - new Date(b.paidAt); });
}
function addMonths(value, months) {
  const date = new Date(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + Math.max(1, Number(months) || 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}
function expiryAt(personId, at) {
  const person = personById(personId);
  if (!person || person.role === "owner") return null;
  let expires = null;
  paidSalesFor(personId, at).forEach(function (sale) {
    const paidAt = new Date(sale.paidAt);
    const base = expires && expires > paidAt ? expires : paidAt;
    expires = addMonths(base, sale.subscriptionMonthsSnapshot || store.settings.subscriptionMonths);
  });
  return expires;
}
function refreshExpiry(personId) {
  const person = personById(personId);
  if (!person || person.role === "owner") return;
  const sales = paidSalesFor(personId);
  let expires = null;
  sales.forEach(function (sale) {
    const paidAt = new Date(sale.paidAt);
    const base = expires && expires > paidAt ? expires : paidAt;
    expires = addMonths(base, sale.subscriptionMonthsSnapshot || store.settings.subscriptionMonths);
  });
  person.subscriptionExpiresAt = expires ? expires.toISOString() : null;
}
function subscriptionActiveAt(person, at) {
  if (!person) return false;
  if (person.role === "owner") return true;
  const expiry = expiryAt(person.id, at);
  return Boolean(expiry && expiry.getTime() > new Date(at).getTime());
}
function ancestorsFor(personId) {
  const buyer = personById(personId);
  const rows = [];
  let id = buyer && buyer.referrerId;
  const seen = new Set([personId]);
  while (id) {
    if (seen.has(id)) throw httpError(409, "referral_cycle", "The referral chain contains a cycle.");
    seen.add(id);
    const person = personById(id);
    if (!person) throw httpError(409, "missing_inviter", "A referral-chain user is missing.");
    if (person.role === "owner") break;
    rows.push(person);
    id = person.referrerId;
  }
  return rows;
}
function accountBalance(account) {
  return store.ledger.reduce(function (sum, row) { return sum + (row.account === account ? row.delta : 0); }, 0);
}
function saveBoxBalance() {
  return accountBalance("savebox");
}
function activeDiscountTotal() {
  return store.sales.filter(function (sale) { return sale.status === "paid"; }).reduce(function (sum, sale) {
    return sum + Math.max(0, Number(sale.saveBoxDiscountAmount) || 0);
  }, 0);
}
function discountCampaignBudget() {
  const reserveRate = Math.max(0, Math.min(100, Number(store.settings.reserveRate) || 0));
  if (reserveRate >= 100) return 0;
  const active = BigInt(activeDiscountTotal());
  const fundedBasis = BigInt(Math.max(0, saveBoxBalance())) + active;
  const budget = fundedBasis * BigInt(100 - reserveRate) / 100n - active;
  return Number(budget > 0n ? budget : 0n);
}
function minimumBalanceForDiscount(discount) {
  const reserveRate = Math.max(0, Math.min(100, Number(store.settings.reserveRate) || 0));
  if (reserveRate >= 100) return null;
  const rate = BigInt(100 - reserveRate);
  const active = BigInt(activeDiscountTotal());
  const amount = BigInt(discount);
  const immediate = (amount * 100n + rate - 1n) / rate;
  const campaignTarget = ((active + amount) * 100n + rate - 1n) / rate - active;
  return Number(immediate > campaignTarget ? immediate : campaignTarget);
}
function discountQuote(buyerId, planId) {
  const buyer = personById(buyerId);
  const plan = planById(planId);
  if (!buyer || buyer.role === "owner") throw httpError(404, "buyer_not_found", "Buyer must be an existing employee or customer.");
  if (!plan) throw httpError(404, "plan_not_found", "Subscription plan was not found.");
  const listPrice = plan.price;
  const amount = percent(listPrice, store.settings.welcomeRate);
  const prior = store.sales.some(function (sale) { return sale.customerId === buyerId && (sale.status === "paid" || sale.status === "refunded"); });
  const minimum = minimumBalanceForDiscount(amount);
  const balance = saveBoxBalance();
  const eligible = !prior && minimum != null && balance >= minimum && discountCampaignBudget() >= amount;
  let reason = "eligible";
  if (prior) reason = "not_first_paid_subscription";
  else if (minimum == null) reason = "reserve_is_100_percent";
  else if (balance < minimum) reason = "save_box_balance_too_low";
  else if (discountCampaignBudget() < amount) reason = "campaign_budget_too_low";
  return {
    eligible: eligible,
    reason: reason,
    buyerId: buyerId,
    planId: planId,
    listPrice: listPrice,
    discountAmount: amount,
    amountDue: listPrice - amount,
    saveBoxBalance: balance,
    minimumBalanceRequired: minimum,
    campaignBudgetRemaining: discountCampaignBudget(),
    currency: currencyInfo()
  };
}
function currencyInfo() {
  return {
    label: String(store.settings.currencyLabel || ""),
    precision: Math.max(0, Math.min(4, Number(store.settings.currencyPrecision) || 0))
  };
}
function calculateAllocation(buyerId, amountPaid, paidAt) {
  const shopAllocation = percent(amountPaid, store.settings.shopRate);
  const referralPool = Math.max(0, amountPaid - shopAllocation);
  let remaining = BigInt(referralPool);
  let activeCommissions = 0;
  let routedToOwner = 0;
  const commissions = ancestorsFor(buyerId).map(function (person, index) {
    const share = Number((remaining + 1n) / 2n);
    remaining -= BigInt(share);
    const active = subscriptionActiveAt(person, paidAt);
    if (active) activeCommissions += share;
    else routedToOwner += share;
    return {
      userId: person.id,
      name: person.name,
      role: person.role,
      level: index + 1,
      rateOfOriginalPoolPercent: 50 / Math.pow(2, index),
      amount: share,
      subscriptionActiveAtSale: active,
      creditedTo: active ? "user" : "ceo"
    };
  });
  const ownerResidual = Number(remaining / 2n);
  const saveBoxContribution = Number(remaining - BigInt(ownerResidual));
  return {
    shopAllocation: shopAllocation,
    referralPool: referralPool,
    commissions: commissions,
    activeUserCommissions: activeCommissions,
    inactiveCommissionsRoutedToCeo: routedToOwner,
    ceoResidual: ownerResidual,
    saveBoxContribution: saveBoxContribution,
    currency: currencyInfo()
  };
}
function ledgerRow(account, delta, type, sale, personId, note, extra) {
  store.ledger.push(Object.assign({
    id: "entry-" + crypto.randomUUID(),
    date: new Date().toISOString(),
    account: account,
    delta: Math.round(delta),
    type: type,
    saleId: sale ? sale.id : null,
    externalSaleId: sale ? sale.externalSaleId : null,
    personId: personId || null,
    note: note || ""
  }, extra || {}));
}
function commitAllocations(sale) {
  const calc = sale.calculation;
  if (sale.saveBoxDiscountAmount > 0) {
    ledgerRow("savebox", -sale.saveBoxDiscountAmount, "Welcome discount", sale, sale.customerId, "Save Box funded the website welcome discount.");
    ledgerRow("owner", sale.saveBoxDiscountAmount, "Discount subsidy", sale, sale.customerId, "Save Box discount subsidy to the shop.");
  }
  ledgerRow("owner", calc.shopAllocation, "Shop allocation", sale, sale.customerId, "Shop allocation from website subscription sale.");
  if (calc.ceoResidual > 0) ledgerRow("owner", calc.ceoResidual, "CEO residual share", sale, sale.customerId, "Half of the commission pool remainder at the CEO row.");
  if (calc.inactiveCommissionsRoutedToCeo > 0) ledgerRow("owner", calc.inactiveCommissionsRoutedToCeo, "Expired-upline commission to CEO", sale, sale.customerId, "Inactive-upline shares routed to the CEO.");

  const due = Math.max(0, accountBalance("recovery"));
  const recovered = Math.min(calc.saveBoxContribution, due);
  const boxCredit = calc.saveBoxContribution - recovered;
  if (boxCredit > 0) ledgerRow("savebox", boxCredit, "Save Box contribution", sale, sale.customerId, "Half of the remaining pool at the CEO row.");
  if (recovered > 0) ledgerRow("recovery", -recovered, "Refund recovery", sale, sale.customerId, "New Save Box contribution applied to refund recovery due.");
  calc.recoveryApplied = recovered;
  calc.netSaveBoxContribution = boxCredit;
  calc.commissions.forEach(function (commission) {
    if (commission.amount <= 0 || !commission.subscriptionActiveAtSale) return;
    ledgerRow("person:" + commission.userId, commission.amount, "Referral commission", sale, commission.userId,
      "Level " + commission.level + " upline commission; subscription active at sale.");
  });
}
function reverseSale(sale) {
  const rows = store.ledger.filter(function (row) { return row.saleId === sale.id && !row.reversalOf; });
  const saveBoxDelta = rows.filter(function (row) { return row.account === "savebox"; })
    .reduce(function (sum, row) { return sum - row.delta; }, 0);
  rows.filter(function (row) { return row.account !== "savebox"; }).forEach(function (row) {
    if (row.delta !== 0) ledgerRow(row.account, -row.delta, "Refund reversal", sale, row.personId, "Reversal of " + row.type + ".", { reversalOf: row.id });
  });
  if (saveBoxDelta >= 0) {
    if (saveBoxDelta > 0) ledgerRow("savebox", saveBoxDelta, "Refund reversal", sale, sale.customerId, "Restore Save Box discount debit.");
  } else {
    const amountToRemove = -saveBoxDelta;
    const available = Math.max(0, saveBoxBalance());
    const removed = Math.min(available, amountToRemove);
    if (removed > 0) ledgerRow("savebox", -removed, "Refund reversal", sale, sale.customerId, "Reverse remaining Save Box contribution.");
    const shortage = amountToRemove - removed;
    if (shortage > 0) ledgerRow("recovery", shortage, "Refund recovery due", sale, sale.customerId, "Save Box funds were used before the sale refund.");
  }
  sale.status = "refunded";
  sale.refundedAt = new Date().toISOString();
  refreshExpiry(sale.customerId);
}
function userDepth(personId) {
  let userSteps = 1;
  const person = personById(personId);
  let cursor = person;
  const seen = new Set();
  while (cursor && cursor.referrerId && cursor.referrerId !== "owner") {
    if (seen.has(cursor.id)) break;
    seen.add(cursor.id);
    userSteps += 1;
    cursor = personById(cursor.referrerId);
  }
  return Math.max(userSteps + 1, person && person.role === "employee" ? 2 : 3);
}
function balanceByAccountPrefix(prefix) {
  return store.ledger.reduce(function (sum, row) {
    return row.account.indexOf(prefix) === 0 ? sum + row.delta : sum;
  }, 0);
}
function buildStats() {
  const paid = store.sales.filter(function (sale) { return sale.status === "paid"; });
  const plans = new Map();
  const levels = new Map();
  const dates = new Map();
  paid.forEach(function (sale) {
    const planName = sale.planName || sale.planId;
    const planRow = plans.get(sale.planId) || { planId: sale.planId, planName: planName, sales: 0, revenue: 0 };
    planRow.sales += 1;
    planRow.revenue += sale.amountPaid;
    plans.set(sale.planId, planRow);
    const level = userDepth(sale.customerId);
    const levelRow = levels.get(level) || { level: level, sales: 0, revenue: 0 };
    levelRow.sales += 1;
    levelRow.revenue += sale.amountPaid;
    levels.set(level, levelRow);
    const day = new Date(sale.paidAt).toISOString().slice(0, 10);
    const dayRow = dates.get(day) || { date: day, sales: 0, revenue: 0 };
    dayRow.sales += 1;
    dayRow.revenue += sale.amountPaid;
    dates.set(day, dayRow);
  });
  const customers = store.people.filter(function (person) { return person.role === "customer"; }).length;
  const employees = store.people.filter(function (person) { return person.role === "employee"; }).length;
  const activeUsers = store.people.filter(function (person) { return person.role !== "owner" && subscriptionActiveAt(person, new Date()); }).length;
  const activeCommissions = paid.reduce(function (sum, sale) {
    return sum + Number(sale.calculation && sale.calculation.activeUserCommissions || 0);
  }, 0);
  return {
    paidSaleCount: paid.length,
    paidRevenue: paid.reduce(function (sum, sale) { return sum + sale.amountPaid; }, 0),
    shopAllocation: paid.reduce(function (sum, sale) {
      return sum + Number(sale.calculation && sale.calculation.shopAllocation || 0);
    }, 0),
    activeUserCommissions: activeCommissions,
    ceoPocketBalance: accountBalance("owner"),
    saveBoxBalance: saveBoxBalance(),
    saveBoxDiscountSpend: paid.reduce(function (sum, sale) { return sum + Number(sale.saveBoxDiscountAmount || 0); }, 0),
    recoveryDue: Math.max(0, accountBalance("recovery")),
    userCount: customers + employees,
    customerCount: customers,
    employeeCount: employees,
    activeSubscriptionCount: activeUsers,
    salesByPlan: Array.from(plans.values()).sort(function (a, b) { return b.revenue - a.revenue; }),
    salesByBuyerLevel: Array.from(levels.values()).sort(function (a, b) { return a.level - b.level; }),
    salesByPaidDate: Array.from(dates.values()).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 90),
    currency: currencyInfo()
  };
}
function personMetrics(personId) {
  const sales = store.sales.filter(function (sale) { return sale.status === "paid" && sale.customerId === personId; });
  const earned = accountBalance("person:" + personId);
  return {
    paidSales: sales.length,
    paidRevenue: sales.reduce(function (sum, sale) { return sum + sale.amountPaid; }, 0),
    commissionsEarned: earned
  };
}
function memberDashboard(userId) {
  const person = personById(userId);
  if (!person || person.role === "owner") throw httpError(404, "member_not_found", "A member account was not found.");
  const childrenByParent = new Map();
  store.people.forEach(function (row) {
    if (row.role === "owner") return;
    if (!childrenByParent.has(row.referrerId)) childrenByParent.set(row.referrerId, []);
    childrenByParent.get(row.referrerId).push(row);
  });
  childrenByParent.forEach(function (children) { children.sort(function (a, b) { return a.name.localeCompare(b.name); }); });

  const seen = new Set([person.id]);
  const order = [];
  const depth = new Map();
  const stack = (childrenByParent.get(person.id) || []).slice().reverse().map(function (child) {
    depth.set(child.id, 1);
    return child.id;
  });
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    const nextDepth = (depth.get(id) || 0) + 1;
    (childrenByParent.get(id) || []).slice().reverse().forEach(function (child) {
      if (!seen.has(child.id)) {
        depth.set(child.id, nextDepth);
        stack.push(child.id);
      }
    });
  }
  const teamIds = new Set(order);
  const paidByUser = new Map();
  const teamSales = store.sales.filter(function (sale) { return sale.status === "paid" && teamIds.has(sale.customerId); });
  teamSales.forEach(function (sale) {
    const stats = paidByUser.get(sale.customerId) || { count: 0, volume: 0 };
    stats.count += 1;
    stats.volume += Number(sale.amountPaid || 0);
    paidByUser.set(sale.customerId, stats);
  });
  const commissionAccount = "person:" + person.id;
  const commissionEntries = store.ledger.filter(function (row) { return row.account === commissionAccount; })
    .slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  const salesById = new Map(store.sales.map(function (sale) { return [sale.id, sale]; }));
  const branchCommission = new Map();
  commissionEntries.forEach(function (entry) {
    const sale = salesById.get(entry.saleId);
    let buyer = sale && personById(sale.customerId);
    let guard = 0;
    while (buyer && buyer.referrerId && buyer.referrerId !== person.id && guard < store.people.length) {
      buyer = personById(buyer.referrerId);
      guard += 1;
    }
    if (buyer && buyer.referrerId === person.id) {
      branchCommission.set(buyer.id, (branchCommission.get(buyer.id) || 0) + Number(entry.delta || 0));
    }
  });
  const treeNodes = new Map();
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const id = order[i];
    const row = personById(id);
    const children = (childrenByParent.get(id) || []).map(function (child) { return treeNodes.get(child.id); }).filter(Boolean);
    const own = paidByUser.get(id) || { count: 0, volume: 0 };
    const active = subscriptionActiveAt(row, new Date());
    treeNodes.set(id, {
      name: row.name,
      role: row.role,
      levelBelowMember: depth.get(id) || 1,
      subscriptionActive: active,
      subscriptionExpiresAt: row.subscriptionExpiresAt || null,
      paidSubscriptions: own.count,
      directReferrals: (childrenByParent.get(id) || []).length,
      teamMembers: 1 + children.reduce(function (sum, child) { return sum + child.teamMembers; }, 0),
      activeTeamMembers: (active ? 1 : 0) + children.reduce(function (sum, child) { return sum + child.activeTeamMembers; }, 0),
      teamPaidSales: own.count + children.reduce(function (sum, child) { return sum + child.teamPaidSales; }, 0),
      teamPaidVolume: own.volume + children.reduce(function (sum, child) { return sum + child.teamPaidVolume; }, 0),
      commissionForMember: (depth.get(id) || 1) === 1 ? (branchCommission.get(id) || 0) : null,
      children: children
    });
  }
  const userSales = store.sales.filter(function (sale) {
    return sale.customerId === person.id && (sale.status === "paid" || sale.status === "refunded");
  }).slice().sort(function (a, b) { return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt); });
  const latestPaid = userSales.find(function (sale) { return sale.status === "paid"; }) || null;
  const inviter = personById(person.referrerId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const commissionThisMonth = commissionEntries.reduce(function (sum, row) {
    return new Date(row.date).getTime() >= monthStart.getTime() ? sum + Number(row.delta || 0) : sum;
  }, 0);
  const routedToCeo = store.ledger.filter(function (row) {
    return row.personId === person.id && (row.type === "Expired-upline commission to CEO"
      || (row.type === "Refund reversal" && String(row.note || "").indexOf("Expired-upline commission to CEO") >= 0));
  }).reduce(function (sum, row) { return sum + Number(row.delta || 0); }, 0);
  const commissionHistory = commissionEntries.slice(0, 100).map(function (entry) {
    const sale = salesById.get(entry.saleId);
    return {
      date: entry.date,
      type: entry.type,
      amount: entry.delta,
      buyerName: sale ? sale.customerName : null,
      planName: sale ? sale.planName : null,
      saleStatus: sale ? sale.status : null
    };
  });
  const directChildren = (childrenByParent.get(person.id) || []).map(function (child) { return treeNodes.get(child.id); }).filter(Boolean);
  const welcomeDiscounts = (store.settings.plans || []).map(function (plan) {
    const quote = discountQuote(person.id, plan.id);
    return {
      planId: plan.id,
      planName: plan.name,
      listPrice: quote.listPrice,
      discountAmount: quote.discountAmount,
      amountDue: quote.amountDue,
      eligible: quote.eligible,
      reason: quote.reason
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    currency: currencyInfo(),
    member: {
      name: person.name,
      role: person.role,
      level: userDepth(person.id),
      joinedAt: person.createdAt,
      inviterName: inviter ? inviter.name : null,
      subscriptionActive: subscriptionActiveAt(person, new Date()),
      subscriptionExpiresAt: person.subscriptionExpiresAt || null,
      currentPlan: latestPaid ? latestPaid.planName : null,
      lastPaymentAt: latestPaid ? latestPaid.paidAt : null
    },
    stats: {
      directReferrals: directChildren.length,
      teamMembers: order.length,
      activeTeamMembers: order.filter(function (id) { return subscriptionActiveAt(personById(id), new Date()); }).length,
      teamPaidSales: teamSales.length,
      teamPaidVolume: teamSales.reduce(function (sum, sale) { return sum + Number(sale.amountPaid || 0); }, 0),
      commissionBalance: accountBalance(commissionAccount),
      commissionThisMonth: commissionThisMonth,
      routedToCeoWhileInactive: routedToCeo
    },
    settings: { shopRate: store.settings.shopRate, referralRate: store.settings.referralRate, subscriptionMonths: store.settings.subscriptionMonths },
    welcomeDiscounts: welcomeDiscounts,
    team: directChildren,
    commissions: commissionHistory,
    subscriptions: userSales.slice(0, 50).map(function (sale) {
      return { planName: sale.planName, status: sale.status, amountPaid: sale.amountPaid, paidAt: sale.paidAt || sale.createdAt };
    })
  };
}
function makeTreeNode(person, level, seen) {
  if (seen.has(person.id)) return null;
  seen.add(person.id);
  const children = store.people.filter(function (child) { return child.referrerId === person.id; }).map(function (child) {
    return makeTreeNode(child, level + 1, seen);
  }).filter(Boolean);
  const metrics = person.role === "owner" ? {
    paidSales: 0,
    paidRevenue: 0,
    commissionsEarned: 0
  } : personMetrics(person.id);
  const expiresAt = person.role === "owner" ? null : person.subscriptionExpiresAt || null;
  return {
    id: person.id,
    name: person.name,
    role: person.role,
    referrerId: person.referrerId,
    level: level,
    subscriptionActive: person.role === "owner" || Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now()),
    subscriptionExpiresAt: expiresAt,
    paidSales: metrics.paidSales,
    paidRevenue: metrics.paidRevenue,
    commissionsEarned: metrics.commissionsEarned,
    directReferrals: children.length,
    children: children
  };
}
function buildTree() {
  const owner = personById("owner");
  const seen = new Set();
  const root = makeTreeNode(owner, 1, seen);
  const orphaned = store.people.filter(function (person) { return !seen.has(person.id); }).map(function (person) {
    return makeTreeNode(person, 1, seen);
  }).filter(Boolean);
  return { root: root, orphaned: orphaned, userCount: store.people.length - 1 };
}
function commissionReport() {
  const byPerson = new Map();
  store.ledger.filter(function (row) { return row.account.indexOf("person:") === 0; }).forEach(function (row) {
    const id = row.account.slice(7);
    const current = byPerson.get(id) || { userId: id, name: (personById(id) || {}).name || "Unknown user", amount: 0, entries: 0 };
    current.amount += row.delta;
    current.entries += 1;
    byPerson.set(id, current);
  });
  const recent = store.ledger.filter(function (row) { return row.account.indexOf("person:") === 0; }).slice().reverse().slice(0, 100).map(function (row) {
    return {
      id: row.id,
      userId: row.account.slice(7),
      userName: (personById(row.account.slice(7)) || {}).name || "Unknown user",
      amount: row.delta,
      type: row.type,
      saleId: row.externalSaleId || row.saleId,
      date: row.date,
      note: row.note
    };
  });
  return {
    totalActiveUserCommissions: Array.from(byPerson.values()).reduce(function (sum, row) { return sum + row.amount; }, 0),
    byUser: Array.from(byPerson.values()).sort(function (a, b) { return b.amount - a.amount; }),
    recent: recent
  };
}
function dashboard() {
  return {
    generatedAt: new Date().toISOString(),
    currency: currencyInfo(),
    settings: {
      shopRate: store.settings.shopRate,
      referralRate: store.settings.referralRate,
      welcomeRate: store.settings.welcomeRate,
      reserveRate: store.settings.reserveRate,
      subscriptionMonths: store.settings.subscriptionMonths,
      plans: store.settings.plans.map(function (plan) { return Object.assign({}, plan); })
    },
    stats: buildStats(),
    tree: buildTree(),
    commissions: commissionReport(),
    recentSales: store.sales.slice().sort(function (a, b) { return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt); }).slice(0, 20).map(function (sale) {
      return {
        externalSaleId: sale.externalSaleId,
        buyerId: sale.customerId,
        buyerName: sale.customerName,
        planId: sale.planId,
        planName: sale.planName,
        status: sale.status,
        listPrice: sale.listPrice,
        saveBoxDiscountAmount: sale.saveBoxDiscountAmount || 0,
        amountPaid: sale.amountPaid,
        paidAt: sale.paidAt,
        calculation: sale.calculation
      };
    })
  };
}
function parsePaidAt(value) {
  const date = value == null ? new Date() : new Date(value);
  if (!Number.isFinite(date.getTime())) throw httpError(400, "invalid_paid_at", "paidAt must be a valid ISO date and time.");
  if (date.getTime() > Date.now() + 5 * 60 * 1000) throw httpError(400, "future_paid_at", "paidAt cannot be more than five minutes in the future.");
  return date.toISOString();
}
function createUser(body) {
  const id = safeText(body.id, "user_id", 120);
  if (id === "owner") throw httpError(400, "reserved_user_id", "The id 'owner' is reserved for the CEO / Shop Owner.");
  const name = safeText(body.name, "name", 200);
  const role = body.role === "employee" ? "employee" : body.role === "customer" ? "customer" : null;
  if (!role) throw httpError(400, "invalid_role", "role must be 'employee' or 'customer'.");
  const requestedReferrer = body.referrerId == null || body.referrerId === "" ? null : safeText(body.referrerId, "referrer_id", 120);
  const referrerId = role === "employee" && requestedReferrer == null ? "owner" : requestedReferrer;
  if (role === "employee" && referrerId !== "owner") throw httpError(400, "invalid_employee_referrer", "Employees must be directly under the Shop Owner.");
  if (role === "customer" && referrerId) {
    const referrer = personById(referrerId);
    if (!referrer || (referrer.role !== "employee" && referrer.role !== "customer")) {
      throw httpError(400, "invalid_customer_referrer", "A customer must be referred by an existing employee or customer, or have no inviter.");
    }
  }
  if (role === "employee" && !personById("owner")) throw httpError(409, "missing_owner", "The Shop Owner root is missing.");
  if (referrerId) {
    let cursor = referrerId;
    const seen = new Set([id]);
    while (cursor) {
      if (seen.has(cursor)) throw httpError(400, "referral_cycle", "The selected inviter would create a referral cycle.");
      seen.add(cursor);
      const person = personById(cursor);
      if (!person) break;
      cursor = person.referrerId;
    }
  }
  const existing = personById(id);
  if (existing) {
    if (existing.name === name && existing.role === role && existing.referrerId === referrerId) return { person: existing, created: false };
    throw httpError(409, "user_conflict", "This user id already exists with different profile or inviter details.");
  }
  const person = {
    id: id,
    name: name,
    role: role,
    referrerId: referrerId,
    createdAt: new Date().toISOString(),
    subscriptionExpiresAt: null
  };
  store.people.push(person);
  return { person: person, created: true };
}
function updateSettings(body) {
  const next = Object.assign({}, store.settings);
  ["shopRate", "referralRate", "welcomeRate", "reserveRate"].forEach(function (key) {
    if (body[key] == null) return;
    const value = Number(body[key]);
    if (!Number.isFinite(value) || value < 0 || value > 100 || Math.abs(value * 10 - Math.round(value * 10)) > 0.000001) {
      throw httpError(400, "invalid_" + key, key + " must be from 0 to 100 in 0.1 increments.");
    }
    next[key] = Math.round(value * 10) / 10;
  });
  if (Math.abs(Number(next.shopRate) + Number(next.referralRate) - 100) > 0.000001) {
    throw httpError(400, "invalid_allocation_total", "shopRate and referralRate must add to 100.");
  }
  if (body.subscriptionMonths != null) {
    const months = Number(body.subscriptionMonths);
    if (!Number.isInteger(months) || months < 1 || months > 24) throw httpError(400, "invalid_subscription_months", "subscriptionMonths must be an integer from 1 to 24.");
    next.subscriptionMonths = months;
  }
  if (body.currencyPrecision != null) {
    const precision = Number(body.currencyPrecision);
    if (!Number.isInteger(precision) || precision < 0 || precision > 4) throw httpError(400, "invalid_currency_precision", "currencyPrecision must be an integer from 0 to 4.");
    if ((store.sales.length || store.ledger.length) && precision !== Number(store.settings.currencyPrecision || 0)) {
      throw httpError(409, "currency_precision_locked", "Currency precision is locked after a sale or financial entry exists.");
    }
    next.currencyPrecision = precision;
  }
  if (body.currencyLabel != null) {
    const label = String(body.currencyLabel).trim();
    if (label.length > 32) throw httpError(400, "invalid_currency_label", "currencyLabel must be 32 characters or fewer.");
    next.currencyLabel = label;
  }
  if (body.plans != null) {
    if (!Array.isArray(body.plans) || body.plans.length < 1 || body.plans.length > 50) {
      throw httpError(400, "invalid_plans", "plans must contain between 1 and 50 plans.");
    }
    const ids = new Set();
    next.plans = body.plans.map(function (plan) {
      const id = safeText(plan && plan.id, "plan_id", 80);
      const name = safeText(plan && plan.name, "plan_name", 100);
      const price = safeAmount(plan && plan.price, "plan_price", true);
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) throw httpError(400, "invalid_plan_id", "Plan ids may contain letters, numbers, underscores, and hyphens.");
      if (ids.has(id)) throw httpError(400, "duplicate_plan_id", "Plan ids must be unique.");
      ids.add(id);
      return { id: id, name: name, price: price };
    });
  }
  store.settings = next;
  return {
    shopRate: next.shopRate,
    referralRate: next.referralRate,
    welcomeRate: next.welcomeRate,
    reserveRate: next.reserveRate,
    subscriptionMonths: next.subscriptionMonths,
    currencyPrecision: next.currencyPrecision,
    currencyLabel: next.currencyLabel,
    plans: next.plans.map(function (plan) { return Object.assign({}, plan); })
  };
}
function postSale(body, idempotencyKey) {
  const externalSaleId = safeText(body.externalSaleId || idempotencyKey, "external_sale_id", 160);
  const buyerId = safeText(body.buyerId, "buyer_id", 120);
  const planId = safeText(body.planId, "plan_id", 80);
  const buyer = personById(buyerId);
  if (!buyer || buyer.role === "owner") throw httpError(404, "buyer_not_found", "buyerId must match an existing employee or customer user.");
  const plan = planById(planId);
  if (!plan) throw httpError(404, "plan_not_found", "planId must match a configured subscription plan.");
  const amountPaid = safeAmount(body.amountPaid, "amountPaid", false);
  const listPrice = body.listPrice == null ? plan.price : safeAmount(body.listPrice, "listPrice", false);
  const discountAmount = body.saveBoxDiscountAmount == null ? 0 : safeAmount(body.saveBoxDiscountAmount, "saveBoxDiscountAmount", true);
  const paidAt = parsePaidAt(body.paidAt);
  const already = store.sales.find(function (sale) { return sale.externalSaleId === externalSaleId; });
  if (already) {
    const same = already.customerId === buyerId && already.planId === planId && already.amountPaid === amountPaid
      && (already.saveBoxDiscountAmount || 0) === discountAmount;
    if (!same) throw httpError(409, "sale_id_conflict", "externalSaleId already exists with different sale data.");
    return { sale: already, created: false };
  }
  if (discountAmount > 0) {
    if (body.discountSource !== "savebox_welcome") throw httpError(400, "invalid_discount_source", "Save Box discounts must use discountSource='savebox_welcome'.");
    const quote = discountQuote(buyerId, planId);
    if (!quote.eligible) throw httpError(409, "discount_not_eligible", "The Save Box welcome discount is not currently eligible: " + quote.reason + ".");
    if (discountAmount !== quote.discountAmount || amountPaid !== listPrice - discountAmount || listPrice !== plan.price) {
      throw httpError(400, "discount_amount_mismatch", "For this plan, amountPaid must equal listPrice minus the eligible Save Box welcome discount.");
    }
  } else if (body.discountSource === "savebox_welcome") {
    throw httpError(400, "missing_discount_amount", "A Save Box welcome discount requires a positive saveBoxDiscountAmount.");
  }
  const sale = {
    id: "web-" + crypto.randomUUID(),
    externalSaleId: externalSaleId,
    customerId: buyer.id,
    customerName: buyer.name,
    planId: plan.id,
    planName: plan.name,
    status: "paid",
    createdAt: paidAt,
    paidAt: paidAt,
    listPrice: listPrice,
    discountAmount: discountAmount,
    saveBoxDiscountAmount: discountAmount,
    amountPaid: amountPaid,
    subscriptionMonthsSnapshot: store.settings.subscriptionMonths
  };
  sale.calculation = calculateAllocation(buyer.id, amountPaid, paidAt);
  store.sales.push(sale);
  commitAllocations(sale);
  refreshExpiry(buyer.id);
  return { sale: sale, created: true };
}
async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const base = new URL(req.url, "http://localhost");
  const pathname = base.pathname.replace(/\/+$/, "") || "/";
  if (req.method === "GET" && pathname === "/api/v1/health") {
    json(res, 200, { ok: true, service: "Branch Ledger API", version: "1.0.0", time: new Date().toISOString() });
    return;
  }
  if (req.method === "GET" && pathname === "/") {
    json(res, 200, { service: "Branch Ledger website integration API", version: "1.0.0", documentation: "/API-INTEGRATION.md", health: "/api/v1/health" });
    return;
  }
  if (req.method === "GET" && pathname === "/API-INTEGRATION.md") {
    try {
      const contents = await fs.readFile(path.join(APP_DIR, "API-INTEGRATION.md"));
      res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8", "Content-Length": contents.length, "X-Content-Type-Options": "nosniff" });
      res.end(contents);
    } catch (_) {
      fail(res, 404, "documentation_not_found", "Integration documentation was not found.");
    }
    return;
  }
  const memberMatch = pathname.match(/^\/api\/v1\/member\/([^/]+)$/);
  if (req.method === "GET" && memberMatch) {
    if (!hasWriteAccess(req)) {
      fail(res, 401, "website_server_key_required", "This member report is available only to an authenticated website server.");
      return;
    }
    try {
      json(res, 200, memberDashboard(decodeURIComponent(memberMatch[1])));
    } catch (error) {
      fail(res, error.status || 500, error.code || "request_failed", error.status ? error.message : "The API could not process this request.");
    }
    return;
  }
  if (req.method !== "GET" && !hasWriteAccess(req)) {
    fail(res, 401, "write_key_required", "A valid write API key is required for this operation.");
    return;
  }
  if (req.method === "GET" && !hasReadAccess(req)) {
    fail(res, 401, "read_key_required", "A valid read-only or write API key is required.");
    return;
  }
  try {
    if (req.method === "GET" && pathname === "/api/v1/dashboard") {
      json(res, 200, dashboard());
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/stats") {
      json(res, 200, buildStats());
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/tree") {
      json(res, 200, buildTree());
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/commissions") {
      json(res, 200, commissionReport());
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/sales") {
      const status = base.searchParams.get("status");
      const rows = store.sales.filter(function (sale) { return !status || sale.status === status; })
        .slice().sort(function (a, b) { return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt); });
      json(res, 200, { count: rows.length, sales: rows });
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/users") {
      json(res, 200, { count: store.people.length - 1, users: store.people.filter(function (person) { return person.role !== "owner"; }).map(function (person) {
        return Object.assign({}, person, {
          level: userDepth(person.id),
          subscriptionActive: subscriptionActiveAt(person, new Date()),
          metrics: personMetrics(person.id)
        });
      }) });
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/plans") {
      json(res, 200, { currency: currencyInfo(), plans: store.settings.plans.map(function (plan) { return Object.assign({}, plan); }) });
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/settings") {
      json(res, 200, {
        shopRate: store.settings.shopRate,
        referralRate: store.settings.referralRate,
        welcomeRate: store.settings.welcomeRate,
        reserveRate: store.settings.reserveRate,
        subscriptionMonths: store.settings.subscriptionMonths,
        currencyPrecision: store.settings.currencyPrecision,
        currencyLabel: store.settings.currencyLabel,
        plans: store.settings.plans.map(function (plan) { return Object.assign({}, plan); })
      });
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/discount-quote") {
      json(res, 200, discountQuote(base.searchParams.get("buyerId"), base.searchParams.get("planId")));
      return;
    }
    if (req.method === "GET" && pathname === "/api/v1/ledger") {
      json(res, 200, { count: store.ledger.length, ledger: store.ledger.slice().reverse() });
      return;
    }
    if (req.method === "POST" && pathname === "/api/v1/users") {
      const body = await readJson(req);
      const result = await withMutation(function () { return createUser(body); });
      json(res, result.created ? 201 : 200, { created: result.created, user: result.person });
      return;
    }
    if (req.method === "POST" && pathname === "/api/v1/sales") {
      const body = await readJson(req);
      const key = String(req.headers["idempotency-key"] || "").trim();
      const result = await withMutation(function () { return postSale(body, key); });
      json(res, result.created ? 201 : 200, { created: result.created, sale: result.sale });
      return;
    }
    if (req.method === "PUT" && pathname === "/api/v1/settings") {
      const body = await readJson(req);
      const settings = await withMutation(function () { return updateSettings(body); });
      json(res, 200, { settings: settings });
      return;
    }
    const refundMatch = pathname.match(/^\/api\/v1\/sales\/([^/]+)\/refund$/);
    if (req.method === "POST" && refundMatch) {
      const externalSaleId = decodeURIComponent(refundMatch[1]);
      const result = await withMutation(function () {
        const sale = store.sales.find(function (item) { return item.externalSaleId === externalSaleId; });
        if (!sale) throw httpError(404, "sale_not_found", "Website sale was not found.");
        if (sale.status === "refunded") return { sale: sale, refunded: false };
        reverseSale(sale);
        return { sale: sale, refunded: true };
      });
      json(res, 200, result);
      return;
    }
    fail(res, 404, "route_not_found", "API route not found.");
  } catch (error) {
    fail(res, error.status || 500, error.code || "request_failed", error.status ? error.message : "The API could not process this request.");
  }
}

async function start() {
  await ensureApiKeys();
  store = await loadStore();
  store.people.forEach(function (person) {
    if (person.role !== "owner" && !Object.prototype.hasOwnProperty.call(person, "subscriptionExpiresAt")) refreshExpiry(person.id);
  });
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || "127.0.0.1";
  const server = http.createServer(function (req, res) {
    handler(req, res).catch(function () {
      if (!res.headersSent) fail(res, 500, "internal_error", "The API encountered an unexpected error.");
      else res.destroy();
    });
  });
  server.listen(port, host, function () {
    console.log("Branch Ledger API listening on http://" + host + ":" + port);
    console.log("Data file: " + DATA_FILE);
    console.log("Allowed browser origins: " + (process.env.ALLOWED_ORIGINS || "http://127.0.0.1:8766,http://localhost:8766,http://127.0.0.1:8787,http://localhost:8787"));
  });
}

start().catch(function (error) {
  console.error("Could not start Branch Ledger API:", error.message);
  process.exitCode = 1;
});
