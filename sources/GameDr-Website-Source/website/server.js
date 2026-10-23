// Entry point: open the data store (PostgreSQL if DATABASE_URL is set, JSON files otherwise), then start the site.
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '16';   // password hashing runs on these threads
require('dotenv').config();
require('./store').init().then(() => require('./app')).catch(e => {
  console.error('Could not start:', e.message);
  process.exit(1);
});
