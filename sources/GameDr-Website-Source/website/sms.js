// SMS sending for phone verification, using sms.ir (https://sms.ir/rest-api/).
//
// .env settings:
//   SMS_PROVIDER=smsir
//   SMS_API_KEY=...          your sms.ir API key (never put it in the code)
//   SMS_TEMPLATE_ID=123456   id of a VERIFICATION template created in your sms.ir panel
//   SMS_TEMPLATE_PARAM=Code  name of the variable inside that template (default "Code")
//   SMS_API_BASE=...         optional, defaults to https://api.sms.ir/v1 (used by tests)
//
// sms.ir sends codes only through a pre-approved template, so the template id is
// required. Until provider + key + template id are all set, nothing is sent: messages
// are saved in data/sms-outbox.json and shown in the admin dashboard (development).
//
// Note: sms.ir delivers to Iranian mobile numbers only (+98 9xx xxx xxxx).
const fs = require('fs');
const path = require('path');

const OUTBOX = path.join(__dirname, 'data', 'sms-outbox.json');
const base = () => (process.env.SMS_API_BASE || 'https://api.sms.ir/v1').replace(/\/+$/, '');

function status() {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
  const hasKey = !!process.env.SMS_API_KEY;
  const hasTemplate = !!parseInt(process.env.SMS_TEMPLATE_ID, 10);
  const hasLine = !!String(process.env.SMS_LINE_NUMBER || '').trim();
  const notificationsEnabled = !/^(?:0|false|off|no)$/i.test(String(process.env.SMS_NOTIFICATIONS_ENABLED || 'true'));
  return {
    provider, hasKey, hasTemplate, hasLine, notificationsEnabled,
    configured: provider === 'smsir' && hasKey && hasTemplate,
    notificationConfigured: provider === 'smsir' && hasKey && hasLine && notificationsEnabled,
  };
}
const configured = () => status().configured;

// +989121234567 / 09121234567 / 989121234567 / 9121234567 -> "9121234567" (what sms.ir expects).
// Anything else (foreign numbers, landlines such as +98 21...) -> null.
function iranMobile(phone) {
  const raw = String(phone || '').replace(/[\s\-().]/g, '');
  let national;
  if (raw.startsWith('+')) {
    if (!raw.startsWith('+98')) return null;       // another country
    national = raw.slice(3);
  } else {
    national = raw.replace(/^(?:0098|98|0)/, '');   // 0098912..., 98912..., 0912...
  }
  // Iranian mobile numbers: 9 + one of 0-3 or 9 + 8 more digits
  return /^9[0-39]\d{8}$/.test(national) ? national : null;
}

function writeOutbox(entry) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(OUTBOX, 'utf8')); } catch (e) { /* first message */ }
  list.unshift({ id: Date.now().toString(36), date: new Date().toISOString(), ...entry });
  fs.writeFileSync(OUTBOX, JSON.stringify(list.slice(0, 50), null, 2) + '\n');
}
function readOutbox() {
  try { return JSON.parse(fs.readFileSync(OUTBOX, 'utf8')); } catch (e) { return []; }
}

async function call(method, pathname, body) {
  const res = await fetch(base() + pathname, {
    method,
    headers: { 'X-API-KEY': process.env.SMS_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* non-JSON error page */ }
  return { http: res.status, data };
}

// Sends a verification code. { to: '+989121234567', code: '123456', text: '...' }
// Resolves { sent: true } for a real SMS, { sent: false, outbox: true } in development.
// Rejects with err.code = 'unsupported_number' when the number is not an Iranian mobile.
async function sendCode({ to, code, text }) {
  if (!configured()) {
    writeOutbox({ to, text });
    console.log('[sms] sms.ir is not fully set up (provider/key/template) - message to ' + to + ' saved in data/sms-outbox.json');
    return { sent: false, outbox: true };
  }
  const mobile = iranMobile(to);
  if (!mobile) {
    const e = new Error('SMS verification currently works for Iranian mobile numbers only.');
    e.code = 'unsupported_number';
    throw e;
  }
  const { http, data } = await call('POST', '/send/verify', {
    mobile,
    templateId: parseInt(process.env.SMS_TEMPLATE_ID, 10),
    parameters: [{ name: process.env.SMS_TEMPLATE_PARAM || 'Code', value: String(code) }],
  });
  if (http !== 200 || data.status !== 1) {
    const e = new Error('sms.ir refused the message: ' + (data.message || ('HTTP ' + http)) + (data.status !== undefined ? ' (status ' + data.status + ')' : ''));
    e.code = 'provider_error';
    throw e;
  }
  return { sent: true, messageId: data.data && data.data.messageId };
}

// Sends a customer notification as a regular SMS. This uses sms.ir's bulk
// endpoint because notification text is not a verification-code template.
// The sender line is intentionally kept in the environment, never in source.
async function sendNotification({ to, text }) {
  const messageText = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 420);
  if (!messageText) return { sent: false, skipped: true };
  if (!status().notificationConfigured) {
    writeOutbox({ kind: 'notification', to, text: messageText });
    console.log('[sms] notification SMS is not fully set up - message to ' + to + ' saved in data/sms-outbox.json');
    return { sent: false, outbox: true };
  }
  const mobile = iranMobile(to);
  if (!mobile) {
    const e = new Error('SMS notifications currently work for Iranian mobile numbers only.');
    e.code = 'unsupported_number';
    throw e;
  }
  const { http, data } = await call('POST', '/send/bulk', {
    lineNumber: String(process.env.SMS_LINE_NUMBER).trim(),
    messageText,
    mobiles: [mobile],
    sendDateTime: null,
  });
  const accepted = http >= 200 && http < 300 && (data.status === 1 || data.status === 200 || data.status === true);
  if (!accepted) {
    const e = new Error('sms.ir refused the notification: ' + (data.message || ('HTTP ' + http)) + (data.status !== undefined ? ' (status ' + data.status + ')' : ''));
    e.code = 'provider_error';
    throw e;
  }
  return { sent: true, packId: data.data && data.data.packId, messageIds: data.data && data.data.messageIds };
}

// Read-only check that the key works; returns the remaining credit.
async function credit() {
  if (!process.env.SMS_API_KEY) throw new Error('SMS_API_KEY is not set');
  const { http, data } = await call('GET', '/credit');
  if (http !== 200 || data.status !== 1) throw new Error((data.message || 'HTTP ' + http) + (data.status !== undefined ? ' (status ' + data.status + ')' : ''));
  return data.data;
}

module.exports = { sendCode, sendNotification, configured, status, iranMobile, readOutbox, credit };
