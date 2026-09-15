#!/usr/bin/env node
// Scaffolds a new catalog entry from a GitHub URL, pre-filling everything the
// GitHub API can answer so a contributor only has to supply judgement.
//
//   node scripts/add-source.mjs https://github.com/owner/repo
//   node scripts/add-source.mjs https://github.com/owner/repo --id custom-slug
//
// Writes catalog/sources/<id>.json with TODO markers, then tells you what to
// fill in. It never guesses capabilities, style tags, or use_when - those are
// the parts a human has to get right, and a wrong guess is worse than a blank.
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOURCES_DIR } from './lib.mjs';

const [url, ...rest] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node scripts/add-source.mjs https://github.com/owner/repo [--id slug]');
  process.exit(1);
}
const m = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
if (!m) { console.error('Expected a github.com/owner/repo URL.'); process.exit(1); }
const [, owner, repoName] = m;

const idFlag = rest.indexOf('--id');
const id = (idFlag !== -1 ? rest[idFlag + 1] : repoName).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');

const outPath = join(SOURCES_DIR, `${id}.json`);
if (existsSync(outPath)) { console.error(`${outPath} already exists. Edit it, or pass a different --id.`); process.exit(1); }

const headers = { 'User-Agent': 'ultimate-ui-catalog', Accept: 'application/vnd.github+json' };
// A token lifts the 60/hour unauthenticated rate limit. Optional.
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
if (!res.ok) {
  console.error(`GitHub API returned ${res.status}. ${res.status === 403 ? 'Rate limited - set GITHUB_TOKEN and retry.' : 'Check the URL.'}`);
  process.exit(1);
}
const r = await res.json();
const today = new Date().toISOString().slice(0, 10);

// Probe the conventions that make a source actually usable by an agent.
const probes = [
  [`${(r.homepage || '').replace(/\/$/, '')}/llms.txt`, 'llms_txt', 'Agent-oriented docs digest.'],
  [`https://raw.githubusercontent.com/${r.full_name}/${r.default_branch}/README.md`, 'raw_path', 'Project README.'],
];
const entrypoints = [];
for (const [probeUrl, type, what] of probes) {
  if (!probeUrl.startsWith('http')) continue;
  try {
    const head = await fetch(probeUrl, { method: 'GET', headers: { 'User-Agent': 'ultimate-ui-catalog' } });
    if (head.ok) entrypoints.push({ type, url: probeUrl, what, verified: today });
  } catch { /* offline or blocked - the contributor fills this in by hand */ }
}
if (!entrypoints.length) {
  entrypoints.push({ type: 'docs_url', url: r.homepage || r.html_url, what: 'TODO: what does an agent get here, and when should it reach for it?', verified: null });
}

const entry = {
  id,
  name: r.name,
  repo: r.html_url,
  homepage: r.homepage || null,
  author: { name: r.owner.login, url: r.owner.html_url },
  license: r.license?.spdx_id || 'NOASSERTION',
  license_url: r.license ? `${r.html_url}/blob/${r.default_branch}/LICENSE` : null,
  summary: r.description || 'TODO: one or two sentences, in the maintainers own framing where possible.',
  kind: 'TODO-pick-one: component-library | curated-list | agent-skills | design-language | workshop-tool | generative-tool',
  capabilities: ['TODO-see-catalog/taxonomy.json'],
  stacks: [],
  style_tags: [],
  agent_entrypoints: entrypoints,
  use_when: ['TODO: a concrete situation where this is the right thing to reach for.'],
  avoid_when: ['TODO: an honest limit. Entries without one tend to read as advertising.'],
  metrics: { stars: r.stargazers_count, checked: today },
  added: today,
};

writeFileSync(outPath, JSON.stringify(entry, null, 2) + '\n');
console.log(`
Scaffolded catalog/sources/${id}.json

  license detected : ${entry.license}
  entrypoints found: ${entrypoints.length}

Now fill in by hand:
  1. kind          - one value from the enum in catalog/schema.json
  2. capabilities  - terms from catalog/taxonomy.json (run: node scripts/search.mjs --list)
  3. stacks        - leave [] if it is stack-agnostic, or use the "stack-agnostic" term
  4. style_tags    - only if it carries an aesthetic opinion; a neutral toolkit gets ["neutral"] or []
  5. use_when      - the situations that should pull an agent toward this source
  6. avoid_when    - where it is the wrong tool. Be honest; this is the most useful field in the file.
  7. agent_entrypoints - the how-to-actually-fetch-it part. Verify every URL before opening the PR.
  8. author.credit_note - if the repo moved to an org, credit the original creator here.
  9. watch         - optional: folders or README sections where new items should trigger a
                     review, e.g. { "paths": ["skills/*"] }. See docs/adding-a-source.md.

Then, once the entry is right:
  node scripts/review.mjs ${id}     # records the review and snapshots upstream
  node scripts/validate.mjs && node scripts/build.mjs
`);
