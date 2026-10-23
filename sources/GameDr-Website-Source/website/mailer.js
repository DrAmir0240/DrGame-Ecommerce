// Sends email through Gmail's API (OAuth2) or SMTP when configured in .env.
// Gmail API settings:
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM
// SMTP settings:
//   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE (true for port 465), SMTP_USER, SMTP_PASS, MAIL_FROM
// With neither provider configured the site runs in "outbox" mode: the message is NOT sent,
// it is saved in data/outbox.json so you can read verification codes while developing
// (shown in the admin dashboard). Never expose the outbox to visitors.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTBOX = path.join(__dirname, 'data', 'outbox.json');

const gmailConfigured = () => !!(
  process.env.GMAIL_CLIENT_ID &&
  process.env.GMAIL_CLIENT_SECRET &&
  process.env.GMAIL_REFRESH_TOKEN &&
  (process.env.GMAIL_FROM || process.env.MAIL_FROM || process.env.GMAIL_USER)
);
const smtpConfigured = () => !!process.env.SMTP_HOST;
const configured = () => gmailConfigured() || smtpConfigured();
const provider = () => gmailConfigured() ? 'gmail-api' : smtpConfigured() ? 'smtp' : 'outbox';

function missingGmailSettings() {
  return [
    !process.env.GMAIL_CLIENT_ID ? 'GMAIL_CLIENT_ID' : null,
    !process.env.GMAIL_CLIENT_SECRET ? 'GMAIL_CLIENT_SECRET' : null,
    !process.env.GMAIL_REFRESH_TOKEN ? 'GMAIL_REFRESH_TOKEN' : null,
    !(process.env.GMAIL_FROM || process.env.MAIL_FROM || process.env.GMAIL_USER) ? 'GMAIL_FROM' : null,
  ].filter(Boolean);
}

let transport = null;
let gmailToken = null;
function getTransport() {
  if (transport) return transport;
  const nodemailer = require('nodemailer');
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
  });
  return transport;
}

function encodeMimeHeader(value) {
  const text = String(value || '').replace(/[\r\n]+/g, ' ').trim();
  if (!text) return '';
  return /[\u0080-\uFFFF]/.test(text)
    ? `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`
    : text;
}

function formatAddress(value) {
  const text = String(value || '').replace(/[\r\n]+/g, ' ').trim();
  const match = text.match(/^(.*?)\s*<([^<>\s]+)>$/);
  if (!match) return text;
  const name = encodeMimeHeader(match[1]);
  return name ? `${name} <${match[2]}>` : match[2];
}

function base64Url(value) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function wrappedBase64(value) {
  const encoded = Buffer.from(String(value || ''), 'utf8').toString('base64');
  return encoded.match(/.{1,76}/g)?.join('\r\n') || '';
}

function gmailRawMessage(mail) {
  const boundary = 'DrGame_' + crypto.randomBytes(12).toString('hex');
  const from = process.env.GMAIL_FROM || process.env.MAIL_FROM || process.env.GMAIL_USER || '';
  const headers = [
    from ? `From: ${formatAddress(from)}` : null,
    `To: ${formatAddress(mail.to)}`,
    `Subject: ${encodeMimeHeader(mail.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrappedBase64(mail.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrappedBase64(mail.html || mail.text),
    `--${boundary}--`,
    '',
  ];
  return base64Url(headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n'));
}

async function gmailAccessToken() {
  if (gmailToken && gmailToken.expiresAt > Date.now() + 30_000) return gmailToken.value;
  const body = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error('Gmail OAuth token request failed: ' + (data.error_description || data.error || response.status));
  }
  gmailToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return gmailToken.value;
}

async function gmailRequest(url, options = {}, retry = true) {
  const token = await gmailAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: 'Bearer ' + token },
    signal: options.signal || AbortSignal.timeout(20_000),
  });
  if (response.status === 401 && retry) {
    gmailToken = null;
    return gmailRequest(url, options, false);
  }
  return response;
}

async function sendGmail(mail) {
  const response = await gmailRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: gmailRawMessage(mail) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Gmail send failed: ' + (data.error?.message || data.error || response.status));
  return { sent: true, provider: 'gmail-api', id: data.id || null };
}

function writeOutbox(mail) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(OUTBOX, 'utf8')); } catch (e) { /* first message */ }
  list.unshift({ id: Date.now().toString(36), date: new Date().toISOString(), to: mail.to, subject: mail.subject, text: mail.text });
  fs.writeFileSync(OUTBOX, JSON.stringify(list.slice(0, 50), null, 2) + '\n');
}

// Resolves { sent: true } for real delivery, { sent: false, outbox: true } in outbox mode;
// rejects if the SMTP server refuses the message.
async function sendMail(mail) {
  if (gmailConfigured()) return sendGmail(mail);
  if (!smtpConfigured()) {
    writeOutbox(mail);
    console.log('[mail] SMTP not configured - message to ' + mail.to + ' saved in data/outbox.json');
    return { sent: false, outbox: true };
  }
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return { sent: true };
}

// Read-only provider handshake used by the admin diagnostics panel. Sends no message.
async function verify() {
  if (gmailConfigured()) {
    const response = await gmailRequest('https://gmail.googleapis.com/gmail/v1/users/me/profile', { method: 'GET' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('Gmail API check failed: ' + (data.error?.message || data.error || response.status));
    return true;
  }
  if (!smtpConfigured()) throw new Error('No email provider is configured');
  await getTransport().verify();
  return true;
}

function readOutbox() {
  try { return JSON.parse(fs.readFileSync(OUTBOX, 'utf8')); } catch (e) { return []; }
}

function status() {
  return {
    configured: configured(),
    provider: provider(),
    gmailConfigured: gmailConfigured(),
    smtpConfigured: smtpConfigured(),
    gmailMissing: missingGmailSettings(),
  };
}

module.exports = { sendMail, configured, provider, gmailConfigured, smtpConfigured, status, verify, readOutbox };
