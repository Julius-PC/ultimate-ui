#!/usr/bin/env node
// Query the catalog. This is the entrypoint skills use to turn a brief into a
// shortlist of sources, so they never have to guess what is indexed.
//
//   node scripts/search.mjs --style dark-first --stack react
//   node scripts/search.mjs --capability motion --json
//   node scripts/search.mjs --text "data table"
//   node scripts/search.mjs --id shadcn-ui --json     # full entry for one source
//   node scripts/search.mjs --list                    # available filter terms
//
// Filters combine with AND. Results are ranked by how many filters matched,
// never by star count - popularity is not a fit signal.
import { loadSources, taxonomy } from './lib.mjs';

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(`--${name}`); return i === -1 ? null : argv[i + 1]; };
const has = (name) => argv.includes(`--${name}`);
const multi = (name) => argv.reduce((acc, a, i) => (a === `--${name}` ? [...acc, argv[i + 1]] : acc), []).filter(Boolean);

const T = taxonomy();
if (has('list')) {
  for (const field of ['capabilities', 'stacks', 'style_tags']) {
    console.log(`\n${field}:`);
    for (const [term, def] of Object.entries(T[field])) console.log(`  ${term.padEnd(22)} ${def}`);
  }
  process.exit(0);
}

const wantCaps = multi('capability');
const wantStacks = multi('stack');
const wantStyles = multi('style');
const wantKind = flag('kind');
const wantId = flag('id');
const text = (flag('text') || '').toLowerCase();

// Warn loudly on typos instead of silently returning nothing.
for (const [terms, vocab, label] of [[wantCaps, T.capabilities, 'capability'], [wantStacks, T.stacks, 'stack'], [wantStyles, T.style_tags, 'style']]) {
  for (const t of terms) {
    if (!vocab[t]) {
      console.error(`Unknown ${label} "${t}". Run --list to see valid terms.`);
      process.exit(2);
    }
  }
}

const haystack = (s) => JSON.stringify(s).toLowerCase();
const results = [];
for (const { data: s } of loadSources()) {
  if (wantId && s.id !== wantId) continue;
  let score = 0;
  // A source tagged "stack-agnostic" satisfies any stack filter.
  const stacks = new Set(s.stacks || []);
  const stackOk = wantStacks.every((k) => stacks.has(k) || stacks.has('stack-agnostic'));
  const capsOk = wantCaps.every((c) => (s.capabilities || []).includes(c));
  const styleOk = wantStyles.every((t) => (s.style_tags || []).includes(t));
  if (!stackOk || !capsOk || !styleOk) continue;
  if (wantKind && s.kind !== wantKind) continue;
  if (text && !haystack(s).includes(text)) continue;
  score += wantCaps.length + wantStacks.length + wantStyles.length;
  score += wantStyles.filter((t) => (s.style_tags || []).includes(t)).length; // exact style match weighs double
  results.push({ score, s });
}

results.sort((a, b) => b.score - a.score || a.s.id.localeCompare(b.s.id));

if (has('json')) {
  console.log(JSON.stringify(results.map((r) => r.s), null, 2));
  process.exit(0);
}

if (!results.length) {
  console.log('No sources matched. Loosen a filter, or run --list to check the vocabulary.');
  process.exit(0);
}
for (const { s } of results) {
  console.log(`\n${s.name}  [${s.id}]  ${s.kind}  ${s.license}`);
  console.log(`  by ${s.author.name} — ${s.repo}`);
  console.log(`  ${s.summary}`);
  if (s.use_when?.length) console.log(`  use when: ${s.use_when[0]}`);
  if (s.avoid_when?.length) console.log(`  avoid when: ${s.avoid_when[0]}`);
  const first = s.agent_entrypoints?.[0];
  if (first) console.log(`  start at: ${first.url}`);
}
console.log(`\n${results.length} match(es). Add --json for the full entries, including every agent entrypoint.`);
