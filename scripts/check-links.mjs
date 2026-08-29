#!/usr/bin/env node
// Checks that every agent entrypoint in the catalog still resolves.
//
//   node scripts/check-links.mjs            # all sources
//   node scripts/check-links.mjs shadcn-ui  # one source
//
// Skips patterns with {placeholders}, local-instance APIs, and CLI commands -
// none of those are fetchable. Run it before opening a catalog PR, and
// periodically as maintenance; see skills/catalog-curator/SKILL.md.
import { loadSources } from './lib.mjs';

const only = process.argv[2];
const TIMEOUT_MS = Number(process.env.LINK_TIMEOUT_MS || 20000);
const skipTypes = new Set(['cli', 'mcp']);
const rows = [];

for (const { data: s } of loadSources()) {
  if (only && s.id !== only) continue;
  for (const ep of s.agent_entrypoints || []) {
    if (skipTypes.has(ep.type)) continue;
    if (ep.url.includes('{')) { rows.push([s.id, 'skip', 'pattern', ep.url]); continue; }
    if (/127\.0\.0\.1|localhost/.test(ep.url)) { rows.push([s.id, 'skip', 'local', ep.url]); continue; }
    // Without a timeout one unresponsive host hangs the whole run - and in CI
    // that burns the job's full budget rather than reporting a dead link.
    try {
      const res = await fetch(ep.url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'ultimate-ui-catalog' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      rows.push([s.id, res.ok ? 'ok' : 'FAIL', String(res.status), ep.url]);
    } catch (e) {
      const why = e.name === 'TimeoutError' ? `no response in ${TIMEOUT_MS / 1000}s` : e.message;
      rows.push([s.id, 'FAIL', 'error', `${ep.url} (${why})`]);
    }
  }
}

for (const [id, status, code, url] of rows) {
  console.log(`${status.padEnd(4)} ${code.padEnd(7)} ${id.padEnd(32)} ${url}`);
}
const failed = rows.filter((r) => r[1] === 'FAIL');
console.log(`\n${rows.length} checked, ${failed.length} failed, ${rows.filter(r=>r[1]==='skip').length} skipped.`);
if (failed.length) {
  console.error('\nFix the URL, or drop the entrypoint. A dead entrypoint sends agents at a 404.');
  process.exit(1);
}
