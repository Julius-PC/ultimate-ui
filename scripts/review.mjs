#!/usr/bin/env node
// Records that a person has reviewed a catalog entry: re-read the upstream
// project and confirmed, or fixed, the judgement fields - summary, use_when,
// avoid_when, provides, tags.
//
//   node scripts/review.mjs <id> [<id> ...]
//
// Writes today's date and a snapshot of upstream (description, homepage, major
// version, watched folders and sections) as the new baseline. The weekly
// refresh compares against that baseline, so review flags for these entries
// clear on its next run.
//
// Run it AFTER updating the entry, not instead of. It prints what it is
// acknowledging so you can check nothing was skipped.
import { loadSources, writeSource } from './lib.mjs';
import { fetchUpstream, healthFlags, reviewFlags, RateLimited } from './upstream.mjs';

const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!ids.length) {
  console.error('Usage: node scripts/review.mjs <id> [<id> ...]');
  process.exit(1);
}

const sources = Object.fromEntries(loadSources().map(({ file, data }) => [data.id, { file, data }]));
const unknown = ids.filter((id) => !sources[id]);
if (unknown.length) {
  console.error(`Unknown id(s): ${unknown.join(', ')}. Run: node scripts/search.mjs --json`);
  process.exit(2);
}

const today = new Date().toISOString().slice(0, 10);
let failed = false;

for (const id of ids) {
  const { file, data } = sources[id];
  let result;
  try {
    result = await fetchUpstream(data);
  } catch (e) {
    if (e instanceof RateLimited) { console.error(e.message); process.exit(1); }
    throw e;
  }

  // An incomplete snapshot would silently hide future changes. Refuse instead.
  if (!result.repo || result.problems.length) {
    console.error(`\n${id}: NOT recorded - upstream could not be fully checked:`);
    for (const p of result.problems) console.error(`  - ${p}`);
    failed = true;
    continue;
  }

  const acknowledged = reviewFlags(data, result.state, today)
    .filter((f) => !f.includes('review overdue') && !f.includes('never reviewed'));
  const stillFlagged = healthFlags(data, result.repo);

  data.review = { date: today, baseline: result.state };
  writeSource(file, data);

  console.log(`\n${id}: reviewed ${today}`);
  if (acknowledged.length) {
    console.log('  Acknowledged upstream changes - make sure the entry reflects them:');
    for (const a of acknowledged) console.log(`    - ${a.replace(`${id}: `, '')}`);
  } else {
    console.log('  No upstream changes since the last review.');
  }
  if (stillFlagged.length) {
    console.log('  Still flagged - reviewing does not clear these, fixing the entry does:');
    for (const f of stillFlagged) console.log(`    - ${f.replace(`${id}: `, '')}`);
  }
}

console.log('\nNow run: node scripts/validate.mjs && node scripts/build.mjs');
process.exit(failed ? 1 : 0);
