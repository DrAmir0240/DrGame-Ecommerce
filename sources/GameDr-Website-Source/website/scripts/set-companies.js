// Fills the "company" (studio or publisher) of every game in data/games.json using the
// franchise rules below. Games that already have a company are left alone, so anything you
// edit by hand in the admin is never overwritten. Safe to run again after adding games.
//
// "Company" drives the "For you" suggestions: games from the same company are recommended
// together (The Last of Us <-> Uncharted, both Naughty Dog).
//
// Usage: node scripts/set-companies.js        (add --dry to only print what would change)
const fs = require('fs');
const path = require('path');

const { RULES } = require('../company-rules');


const file = path.join(__dirname, '..', 'data', 'games.json');
const games = JSON.parse(fs.readFileSync(file, 'utf8'));
let set = 0, kept = 0;
const missing = [];
for (const g of games) {
  if (g.company) { kept++; continue; }
  const rule = RULES.find(([re]) => re.test(g.title));
  if (rule) { g.company = rule[1]; set++; } else missing.push(g.title);
}
console.log(`companies set: ${set}, already had one: ${kept}, no rule: ${missing.length}`);
if (missing.length) console.log('no rule for:', missing.join(' | '));
if (!process.argv.includes('--dry')) {
  fs.writeFileSync(file, JSON.stringify(games, null, 2) + '\n');
  console.log('saved data/games.json');
}
