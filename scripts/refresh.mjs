#!/usr/bin/env node
// Refreshes upstream data for every catalog source from the GitHub API, and
// reports anything a person needs to decide about.
//
//   node scripts/refresh.mjs              # update every source file
//   node scripts/refresh.mjs shadcn-ui    # just one
//   node scripts/refresh.mjs --report     # read-only: print, change nothing
//   node scripts/refresh.mjs --strict     # exit 1 if anything needs a human
//   node scripts/refresh.mjs --flags-out flags.md   # also write flags as a markdown list
//
// Writes only generated fields: the `upstream` block and metrics.stars. Never
// touches judgement fields, and never touches `review` - that is recorded by a
// person with scripts/review.mjs.
//
// Flags two kinds of thing (see scripts/upstream.mjs):
//   health - archived, license changed, repo moved, no pushes in a year
//   review - changed since the entry was last reviewed: new items in watched
//            folders or sections, a new major version, a reworded description,
//            or no review in 6 months
//
// Set GITHUB_TOKEN to lift the 60 requests/hour unauthenticated rate limit.
import { writeFileSync } from 'node:fs';
import { loadSources, writeSource } from './lib.mjs';
import { fetchUpstream, healthFlags, reviewFlags, daysBetween, RateLimited, STALE_DAYS } from './upstream.mjs';

const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const strict = args.includes('--strict');
// The weekly workflow reads this file to decide what the review Issue says.
const flagsOutIdx = args.indexOf('--flags-out');
const flagsOut = flagsOutIdx === -1 ? null : args[flagsOutIdx + 1];
const only = args.find((a, i) => !a.startsWith('--') && (flagsOutIdx === -1 || i !== flagsOutIdx + 1));

const today = new Date().toISOString().slice(0, 10);
const attention = [];
const rows = [];

for (const { file, data } of loadSources()) {
  if (only && data.id !== only) continue;

  let result;
  try {
    result = await fetchUpstream(data);
  } catch (e) {
    if (e instanceof RateLimited) { console.error(e.message); process.exit(1); }
    throw e;
  }
  const { repo, release, state, problems } = result;
  attention.push(...problems);
  if (!repo) { rows.push({ id: data.id, note: 'unreachable - see flags' }); continue; }

  attention.push(...healthFlags(data, repo), ...reviewFlags(data, state, today));

  const age = Math.max(0, daysBetween(repo.pushed_at, today));
  rows.push({
    id: data.id,
    last: repo.pushed_at.slice(0, 10),
    age,
    release: release?.tag ?? (release === null ? '—' : '?'),
    reviewed: data.review?.date ?? 'never',
    stars: repo.stargazers_count,
    mark: repo.archived ? ' ARCHIVED' : age > STALE_DAYS ? ' STALE' : '',
  });

  if (reportOnly) continue;

  data.upstream = {
    last_commit: repo.pushed_at,
    default_branch: repo.default_branch,
    archived: !!repo.archived,
    open_issues: repo.open_issues_count ?? null,
    // Keep the last known release if this run could not check.
    latest_release: release === undefined ? (data.upstream?.latest_release ?? null) : (release?.tag ?? null),
    checked: today,
  };
  data.metrics = { ...(data.metrics || {}), stars: repo.stargazers_count, checked: today };
  writeSource(file, data);
}

rows.sort((a, b) => (a.age ?? 1e9) - (b.age ?? 1e9));
console.log(`\n${'id'.padEnd(32)} ${'last commit'.padEnd(11)}  ${'age'.padStart(5)}  ${'release'.padEnd(15)} ${'reviewed'.padEnd(10)}  stars`);
console.log('-'.repeat(92));
for (const r of rows) {
  if (r.note) { console.log(`${r.id.padEnd(32)} ${r.note}`); continue; }
  console.log(`${r.id.padEnd(32)} ${r.last}  ${String(r.age).padStart(4)}d  ${String(r.release).padEnd(15)} ${r.reviewed.padEnd(10)}  ${r.stars}${r.mark}`);
}

if (attention.length) {
  console.log(`\nNeeds a human (${attention.length}):`);
  for (const a of attention) console.log(`  - ${a}`);
  console.log('\nFix the entry if needed, then: node scripts/review.mjs <id>');
  console.log('What each flag means: skills/catalog-curator/SKILL.md');
} else {
  console.log('\nNothing needs attention.');
}

if (flagsOut) writeFileSync(flagsOut, attention.map((a) => `- ${a}`).join('\n') + (attention.length ? '\n' : ''));
if (!reportOnly) console.log('\nSource files updated. Now run: node scripts/build.mjs');
if (strict && attention.length) process.exit(1);
