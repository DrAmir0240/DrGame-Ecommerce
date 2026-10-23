// Data store: PostgreSQL when DATABASE_URL is set, plain JSON files in data/ otherwise.
//
// The whole site reads and writes its data through J(name, fallback) and W(name, value) (admin.js).
// Both are synchronous, so everything lives in memory and is saved in the background:
//   * J() answers from memory (no disk or database round trip per request),
//   * W() updates memory at once and saves a moment later (batched, so a burst of writes becomes one save).
// With PostgreSQL:
//   * lists of records that have an "id" (accounts, orders, purchases, wallet entries, requests ...) are stored
//     one row per record in the `records` table, and only the rows that changed are written;
//   * everything else (settings, texts, the game list) is one jsonb document in the `documents` table.
// The first start with a database imports every data/*.json file that is not in it yet (the files stay as a backup).
//
// Limits: this is ONE server process that owns the data. Do not run two copies of the site against the same
// database (cluster mode / several servers); that needs the per-record queries to be written natively.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKED_UP = new Set(['games.json', 'screenshots.json', 'descriptions.json']);
const FLUSH_MS = parseInt(process.env.STORE_FLUSH_MS, 10) || 400;      // wait this long to batch writes
const FLUSH_MAX_MS = 3000;                                              // but never hold a change longer than this

let pool = null;
const cache = new Map();            // name -> value
const dirty = new Map();            // name -> time it first became dirty (whole collection must be compared)
const dirtyRecs = new Map();        // name -> Set of record ids changed with update() (only those rows are written)
const recState = new Map();         // name -> Map(id -> { s, ord })  what the database holds for record lists
let timer = null, flushing = null, ready = false, retryAt = 0;
const stats = { writes: 0, rowWrites: 0, lastError: '', mode: 'files' };

const clone = v => (v === undefined ? v : structuredClone(v));
const isRecords = v => Array.isArray(v) && v.every(x => x && typeof x === 'object' && typeof x.id === 'string') && new Set(v.map(x => x.id)).size === v.length;

async function init() {
  if (ready) return;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DATABASE_POOL, 10) || 10,
      ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
    pool.on('error', e => { stats.lastError = e.message; });
    stats.mode = 'postgres';
    const enc = (await pool.query('SHOW server_encoding')).rows[0].server_encoding;
    if (enc !== 'UTF8') throw new Error('The database must use UTF8 encoding (this one uses ' + enc + '). Create it with: CREATE DATABASE drgame ENCODING UTF8 TEMPLATE template0;');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (name text PRIMARY KEY, kind text NOT NULL DEFAULT 'doc', data jsonb, updated_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS records (coll text NOT NULL, id text NOT NULL, ord integer NOT NULL, data jsonb NOT NULL, PRIMARY KEY (coll, id));
      CREATE INDEX IF NOT EXISTS records_order ON records (coll, ord);
      CREATE TABLE IF NOT EXISTS document_backups (id bigserial PRIMARY KEY, name text NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
      CREATE INDEX IF NOT EXISTS document_backups_name ON document_backups (name, id DESC);`);
    const docs = (await pool.query('SELECT name, kind, data FROM documents')).rows;
    const recs = (await pool.query('SELECT coll, id, ord, data FROM records ORDER BY coll, ord')).rows;
    const byColl = new Map();
    for (const r of recs) { if (!byColl.has(r.coll)) byColl.set(r.coll, []); byColl.get(r.coll).push(r); }
    for (const d of docs) {
      if (d.kind === 'records') {
        const rows = byColl.get(d.name) || [];
        cache.set(d.name, rows.map(r => r.data));
        recState.set(d.name, new Map(rows.map(r => [r.id, { s: JSON.stringify(r.data), ord: r.ord }])));
      } else cache.set(d.name, d.data);
    }
  }
  // import / load the JSON files
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith('.json') || cache.has(f)) continue;
    try {
      cache.set(f, JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8').replace(/^﻿/, '')));
      if (pool) { dirty.set(f, Date.now()); console.log('[store] imported', f, 'into PostgreSQL'); }
    } catch (e) { /* not valid JSON: ignore the file */ }
  }
  ready = true;
  if (pool && dirty.size) await flush();
  console.log('[store] ready (' + stats.mode + ', ' + cache.size + ' collections)');
}

function get(name, fallback) {
  return cache.has(name) ? clone(cache.get(name)) : fallback;
}
// read-only view for hot paths: the caller must not change what it gets back
function peek(name, fallback) {
  return cache.has(name) ? cache.get(name) : fallback;
}
function set(name, value) {
  cache.set(name, clone(value));
  if (!dirty.has(name)) dirty.set(name, Date.now());
  schedule();
}

// Look a record up by its id without scanning the list (the index is rebuilt when the list is replaced).
const indexes = new Map();
function byId(name, id) {
  const list = cache.get(name);
  if (!Array.isArray(list)) return null;
  let ix = indexes.get(name);
  if (!ix || ix.list !== list || ix.len !== list.length) {
    ix = { list, len: list.length, map: new Map(list.map(x => [x && x.id, x])) };
    indexes.set(name, ix);
  }
  return ix.map.get(id) || null;
}

// Change ONE record of a list in place (accounts, orders ...). Much cheaper than get()+set() of the whole list:
// nothing is copied, and only that row is written to the database.
function update(name, id, fn) {
  const list = cache.get(name);
  const rec = byId(name, id);
  if (!rec) return null;
  fn(rec);
  if (!dirty.has(name)) { if (!dirtyRecs.has(name)) dirtyRecs.set(name, new Set()); dirtyRecs.get(name).add(id); schedule(true); }
  return clone(rec);
}

function schedule(onlyRecs) {
  if (timer) return;
  const oldest = dirty.size ? Math.min(...dirty.values()) : Date.now();
  const wait = Math.max(0, Math.min(FLUSH_MS, FLUSH_MAX_MS - (Date.now() - oldest)), retryAt - Date.now());
  timer = setTimeout(() => { timer = null; flush().catch(() => {}); }, wait);
  if (timer.unref) timer.unref();
}

async function flush() {
  if (flushing) { await flushing; if (!dirty.size && !dirtyRecs.size) return; }
  flushing = (async () => {
    for (const [name, ids] of [...dirtyRecs]) {
      dirtyRecs.delete(name);
      if (dirty.has(name)) continue;                      // the whole collection is saved below anyway
      try { await persistRecs(name, ids); stats.writes++; }
      catch (e) { retryAt = Date.now() + 5000; stats.lastError = name + ': ' + e.message; console.error('[store] could not save', name, '-', e.message); dirty.set(name, Date.now()); }
    }
    const names = [...dirty.keys()];
    for (const name of names) {
      const since = dirty.get(name);
      dirty.delete(name);
      try { await persist(name); stats.writes++; }
      catch (e) { retryAt = Date.now() + 5000; stats.lastError = name + ': ' + e.message; console.error('[store] could not save', name, '-', e.message); if (!dirty.has(name)) dirty.set(name, since); }
    }
  })();
  try { await flushing; } finally { flushing = null; }
  if (dirty.size || dirtyRecs.size) schedule();
}

async function persistRecs(name, ids) {
  const list = cache.get(name);
  if (!Array.isArray(list)) return;
  if (!pool) return persistFile(name, list);
  const state = recState.get(name);
  if (!state) throw new Error('collection not stored as records yet');
  const up = { ids: [], ords: [], datas: [] };
  list.forEach((el, i) => {
    if (!ids.has(el.id)) return;
    const s = JSON.stringify(el);
    const prev = state.get(el.id);
    if (!prev || prev.s !== s) { up.ids.push(el.id); up.ords.push(prev ? prev.ord : i); up.datas.push(s); state.set(el.id, { s, ord: prev ? prev.ord : i }); }
  });
  if (!up.ids.length) return;
  await pool.query('INSERT INTO records (coll, id, ord, data) SELECT $1, * FROM unnest($2::text[], $3::int[], $4::jsonb[]) ON CONFLICT (coll, id) DO UPDATE SET data = EXCLUDED.data', [name, up.ids, up.ords, up.datas]);
  stats.rowWrites += up.ids.length;
}

async function persist(name) {
  const value = cache.get(name);
  if (!pool) return persistFile(name, value);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    if (BACKED_UP.has(name)) {
      const old = await c.query("SELECT kind, data FROM documents WHERE name = $1", [name]);
      if (old.rowCount && old.rows[0].kind === 'doc' && old.rows[0].data !== null) {
        await c.query('INSERT INTO document_backups (name, data) VALUES ($1, $2)', [name, old.rows[0].data]);
        await c.query('DELETE FROM document_backups WHERE name = $1 AND id NOT IN (SELECT id FROM document_backups WHERE name = $1 ORDER BY id DESC LIMIT 30)', [name]);
      }
    }
    if (isRecords(value)) {
      const state = recState.get(name) || new Map();
      const up = { ids: [], ords: [], datas: [] }, seen = new Set(), next = new Map();
      value.forEach((el, i) => {
        const s = JSON.stringify(el);
        seen.add(el.id);
        next.set(el.id, { s, ord: i });
        const prev = state.get(el.id);
        if (!prev || prev.s !== s || prev.ord !== i) { up.ids.push(el.id); up.ords.push(i); up.datas.push(s); }
      });
      const gone = [...state.keys()].filter(id => !seen.has(id));
      await c.query("INSERT INTO documents (name, kind, data, updated_at) VALUES ($1, 'records', NULL, now()) ON CONFLICT (name) DO UPDATE SET kind = 'records', data = NULL, updated_at = now()", [name]);
      if (gone.length) await c.query('DELETE FROM records WHERE coll = $1 AND id = ANY($2::text[])', [name, gone]);
      for (let i = 0; i < up.ids.length; i += 2000) {
        await c.query(
          'INSERT INTO records (coll, id, ord, data) SELECT $1, * FROM unnest($2::text[], $3::int[], $4::jsonb[]) ON CONFLICT (coll, id) DO UPDATE SET ord = EXCLUDED.ord, data = EXCLUDED.data',
          [name, up.ids.slice(i, i + 2000), up.ords.slice(i, i + 2000), up.datas.slice(i, i + 2000)]);
      }
      stats.rowWrites += up.ids.length + gone.length;
      await c.query('COMMIT');
      recState.set(name, next);
    } else {
      await c.query("INSERT INTO documents (name, kind, data, updated_at) VALUES ($1, 'doc', $2, now()) ON CONFLICT (name) DO UPDATE SET kind = 'doc', data = EXCLUDED.data, updated_at = now()", [name, JSON.stringify(value)]);
      if (recState.has(name)) { await c.query('DELETE FROM records WHERE coll = $1', [name]); recState.delete(name); }
      await c.query('COMMIT');
    }
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (x) { /* connection already gone */ }
    throw e;
  } finally { c.release(); }
}

async function persistFile(name, value) {
  const target = path.join(DATA_DIR, name);
  if (BACKED_UP.has(name) && fs.existsSync(target)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(target, path.join(BACKUP_DIR, `${name.replace('.json', '')}-${stamp}.json`));
    const mine = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(name.replace('.json', '') + '-')).sort();
    for (const old of mine.slice(0, Math.max(0, mine.length - 30))) fs.unlinkSync(path.join(BACKUP_DIR, old));
  }
  const tmp = target + '.tmp';
  await fs.promises.writeFile(tmp, JSON.stringify(value, null, 2) + '\n');
  await fs.promises.rename(tmp, target);
}

// save everything that is waiting (used on shutdown)
async function close() {
  if (timer) { clearTimeout(timer); timer = null; }
  await flush();
  if (pool) await pool.end();
}
let closing = false;
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { if (closing) return; closing = true; close().catch(() => {}).finally(() => process.exit(0)); });
}

module.exports = { init, get, peek, byId, set, update, flush, close, stats, get pending() { return dirty.size + dirtyRecs.size; }, get mode() { return stats.mode; } };
