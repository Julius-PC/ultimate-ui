// Shared helpers. No dependencies on purpose: `node scripts/build.mjs` must work
// on a clean checkout with nothing installed.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCES_DIR = join(ROOT, 'catalog', 'sources');

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const schema = () => readJson(join(ROOT, 'catalog', 'schema.json'));
export const taxonomy = () => readJson(join(ROOT, 'catalog', 'taxonomy.json'));

/** Every source file, sorted by id, each tagged with the file it came from. */
export function loadSources() {
  return readdirSync(SOURCES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ file, data: readJson(join(SOURCES_DIR, file)) }))
    .sort((a, b) => a.data.id.localeCompare(b.data.id));
}

/** Write a source file with keys in schema order, so generated diffs stay readable. */
export function writeSource(file, data) {
  const ordered = {};
  for (const key of Object.keys(schema().properties)) if (data[key] !== undefined) ordered[key] = data[key];
  for (const key of Object.keys(data)) if (ordered[key] === undefined) ordered[key] = data[key];
  writeFileSync(join(SOURCES_DIR, file), JSON.stringify(ordered, null, 2) + '\n');
}

/** Replace the block between <!-- name:start --> and <!-- name:end --> markers. */
export function replaceBlock(text, name, body) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i === -1 || j === -1) throw new Error(`Missing ${start} / ${end} markers`);
  return text.slice(0, i + start.length) + '\n' + body.trim() + '\n' + text.slice(j);
}

/**
 * Minimal frontmatter reader. Handles `key: value` and folded multi-line values
 * (continuation lines indented under the key). Enough for SKILL.md, and it keeps
 * the repo dependency-free.
 */
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) { key = kv[1]; out[key] = kv[2].trim(); continue; }
    if (key && /^\s+\S/.test(line)) out[key] = `${out[key]} ${line.trim()}`.trim();
  }
  return out;
}

/** Every skill, with its frontmatter and the catalog sources it routes to. */
export function loadSkills(sourcesById) {
  const dir = join(ROOT, 'skills');
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((name) => {
      const path = join(dir, name, 'SKILL.md');
      const text = readFileSync(path, 'utf8');
      const fm = parseFrontmatter(text) || {};
      // Link skills back to catalog entries by matching the repo URLs they cite.
      const uses = sourcesById
        ? Object.values(sourcesById)
            .filter((s) => text.includes(s.repo))
            .map((s) => s.id)
            .sort()
        : [];
      return { name, dir: `skills/${name}`, file: `skills/${name}/SKILL.md`, ...fm, uses };
    });
}
