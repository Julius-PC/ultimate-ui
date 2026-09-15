#!/usr/bin/env node
// Refreshes upstream health for every catalog source from the GitHub API, so
// the catalog records how alive each project is rather than asserting it.
//
//   node scripts/refresh.mjs              # update every source file
//   node scripts/refresh.mjs shadcn-ui    # just one
//   node scripts/refresh.mjs --report     # read-only: print freshness, change nothing
//   node scripts/refresh.mjs --strict     # exit 1 if anything needs human attention
//   node scripts/refresh.mjs --flags-out flags.md   # also write flagged items as a markdown list
//
// Writes an `upstream` block into each source file: last commit, default branch,
// archived flag, and the date checked. Also refreshes metrics.stars and flags a
// license that changed under us.
//
// Set GITHUB_TOKEN to lift the 60 requests/hour unauthenticated rate limit.
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOURCES_DIR, loadSources } from './lib.mjs';

const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const strict = args.includes('--strict');
// The weekly workflow reads this file to decide whether to open an Issue.
const flagsOutIdx = args.indexOf('--flags-out');
const flagsOut = flagsOutIdx === -1 ? null : args[flagsOutIdx + 1];
const only = args.find((a, i) => !a.startsWith('--') && (flagsOutIdx === -1 || i !== flagsOutIdx + 1));

const headers = { 'User-Agent': 'ultimate-ui-catalog', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const today = new Date().toISOString().slice(0, 10);
const days = (iso) => Math.round((Date.now() - new Date(iso)) / 86400000);

// Thresholds for "someone should look at this". A curated list can be quiet for
// a year and be fine; a framework going quiet for a year is a signal.
const STALE_DAYS = 365;

const attention = [];
const rows = [];

for (const { file, data } of loadSources()) {
  if (only && data.id !== only) continue;
  const m = data.repo.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!m) { rows.push({ id: data.id, note: 'not a GitHub repo - skipped' }); continue; }

  let r;
  try {
    const res = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}`, { headers });
    if (res.status === 403) {
      console.error('GitHub rate limit hit. Set GITHUB_TOKEN and retry.');
      process.exit(1);
    }
    if (!res.ok) { attention.push(`${data.id}: GitHub returned ${res.status} - repo moved or deleted?`); continue; }
    r = await res.json();
  } catch (e) {
    attention.push(`${data.id}: could not reach GitHub (${e.message})`);
    continue;
  }

  const age = days(r.pushed_at);
  rows.push({ id: data.id, age, stars: r.stargazers_count, archived: r.archived, license: r.license?.spdx_id, last: r.pushed_at.slice(0, 10) });

  // Things a human needs to decide about, not things a script should silently fix.
  if (r.archived) attention.push(`${data.id}: upstream is ARCHIVED`);
  if (age > STALE_DAYS) attention.push(`${data.id}: no pushes in ${age} days`);
  const upstreamLicense = r.license?.spdx_id;
  if (upstreamLicense && upstreamLicense !== data.license) {
    attention.push(`${data.id}: LICENSE CHANGED — catalog says ${data.license}, upstream is now ${upstreamLicense}`);
  }
  if (r.full_name.toLowerCase() !== `${m[1]}/${m[2]}`.toLowerCase()) {
    attention.push(`${data.id}: repo moved to ${r.full_name}`);
  }

  if (reportOnly) continue;

  // Only the generated fields are touched. Judgement fields are never rewritten.
  data.upstream = {
    last_commit: r.pushed_at,
    default_branch: r.default_branch,
    archived: !!r.archived,
    open_issues: r.open_issues_count ?? null,
    checked: today,
  };
  data.metrics = { ...(data.metrics || {}), stars: r.stargazers_count, checked: today };

  // Preserve field order from the schema so diffs stay readable.
  const schema = JSON.parse(readFileSync(join(SOURCES_DIR, '..', 'schema.json'), 'utf8'));
  const ordered = {};
  for (const key of Object.keys(schema.properties)) if (data[key] !== undefined) ordered[key] = data[key];
  for (const key of Object.keys(data)) if (ordered[key] === undefined) ordered[key] = data[key];

  writeFileSync(join(SOURCES_DIR, file), JSON.stringify(ordered, null, 2) + '\n');
}

rows.sort((a, b) => (a.age ?? 1e9) - (b.age ?? 1e9));
console.log('\nid                                last commit    age   stars   license');
console.log('-'.repeat(74));
for (const r of rows) {
  if (r.note) { console.log(`${r.id.padEnd(32)} ${r.note}`); continue; }
  const flag = r.archived ? ' ARCHIVED' : r.age > STALE_DAYS ? ' STALE' : '';
  console.log(`${r.id.padEnd(32)} ${r.last}   ${String(r.age).padStart(4)}d  ${String(r.stars).padStart(6)}  ${(r.license || '?').padEnd(8)}${flag}`);
}

if (attention.length) {
  console.log(`\nNeeds a human (${attention.length}):`);
  for (const a of attention) console.log(`  - ${a}`);
  console.log('\nSee skills/catalog-curator/SKILL.md for what to do about each.');
} else {
  console.log('\nNothing needs attention.');
}

if (flagsOut) writeFileSync(flagsOut, attention.map((a) => `- ${a}`).join('\n') + (attention.length ? '\n' : ''));
if (!reportOnly) console.log('\nSource files updated. Now run: node scripts/build.mjs');
if (strict && attention.length) process.exit(1);
