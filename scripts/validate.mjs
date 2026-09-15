#!/usr/bin/env node
// Validates every catalog/sources/*.json against catalog/schema.json and
// catalog/taxonomy.json. Runs in CI on every pull request.
//
//   node scripts/validate.mjs
//
// Exits non-zero with a list of problems. Deliberately hand-rolled rather than
// pulling in a JSON Schema library - the schema is small and this keeps the
// repo installable with zero dependencies.
import { loadSources, schema, taxonomy } from './lib.mjs';

const S = schema();
const T = taxonomy();
const problems = [];
const seenIds = new Map();

const isUrl = (v) => typeof v === 'string' && /^https?:\/\/\S+$/.test(v);
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const today = new Date().toISOString().slice(0, 10);

for (const { file, data } of loadSources()) {
  const err = (msg) => problems.push(`${file}: ${msg}`);

  for (const key of S.required) {
    if (data[key] === undefined) err(`missing required field "${key}"`);
  }
  for (const key of Object.keys(data)) {
    if (!S.properties[key]) err(`unknown field "${key}" (add it to catalog/schema.json first)`);
  }

  if (data.id && `${data.id}.json` !== file) err(`id "${data.id}" does not match filename`);
  if (data.id && !/^[a-z0-9][a-z0-9-]*$/.test(data.id)) err(`id "${data.id}" must be lowercase kebab-case`);
  if (data.id && seenIds.has(data.id)) err(`duplicate id, also in ${seenIds.get(data.id)}`);
  if (data.id) seenIds.set(data.id, file);

  if (!isUrl(data.repo)) err('repo must be an http(s) URL');
  if (data.homepage != null && !isUrl(data.homepage)) err('homepage must be an http(s) URL or null');
  if (data.license_url != null && !isUrl(data.license_url)) err('license_url must be an http(s) URL or null');

  // Attribution is not optional here. See docs/attribution-policy.md.
  if (!data.author || typeof data.author !== 'object') err('author block is required');
  else {
    if (!data.author.name) err('author.name is required - every source gets credited');
    if (!isUrl(data.author.url)) err('author.url must be an http(s) URL');
    for (const k of Object.keys(data.author)) {
      if (!['name', 'url', 'credit_note'].includes(k)) err(`unknown author field "${k}"`);
    }
  }
  if (!data.license) err('license is required (SPDX id, or NOASSERTION)');

  if (typeof data.summary === 'string') {
    if (data.summary.length < 20) err('summary is too short to be useful');
    if (data.summary.length > 400) err('summary is over 400 chars - move detail into notes');
  }

  const kinds = S.properties.kind.enum;
  if (!kinds.includes(data.kind)) err(`kind "${data.kind}" must be one of: ${kinds.join(', ')}`);

  for (const [field, vocab] of [
    ['capabilities', T.capabilities],
    ['stacks', T.stacks],
    ['style_tags', T.style_tags],
  ]) {
    const list = data[field];
    if (list === undefined) continue;
    if (!Array.isArray(list)) { err(`${field} must be an array`); continue; }
    if (new Set(list).size !== list.length) err(`${field} has duplicate entries`);
    for (const term of list) {
      if (!vocab[term]) err(`${field}: "${term}" is not in catalog/taxonomy.json (add the term there, with a definition, in the same PR)`);
    }
  }
  if (Array.isArray(data.capabilities) && data.capabilities.length === 0) err('capabilities must not be empty');

  const epTypes = S.properties.agent_entrypoints.items.properties.type.enum;
  if (!Array.isArray(data.agent_entrypoints) || data.agent_entrypoints.length === 0) {
    err('agent_entrypoints must list at least one way for an agent to pull real data');
  } else {
    data.agent_entrypoints.forEach((ep, i) => {
      const at = `agent_entrypoints[${i}]`;
      if (!epTypes.includes(ep.type)) err(`${at}.type "${ep.type}" must be one of: ${epTypes.join(', ')}`);
      if (!ep.url) err(`${at}.url is required`);
      if (!ep.what) err(`${at}.what is required - say what an agent gets back`);
      if (ep.verified != null && !isDate(ep.verified)) err(`${at}.verified must be YYYY-MM-DD or null`);
      const remote = ['llms_txt', 'registry_json', 'docs_url', 'raw_path'].includes(ep.type);
      // Local-instance APIs and {placeholder} patterns are legitimately not plain URLs.
      if (remote && !/^https?:\/\//.test(ep.url)) err(`${at}.url should be an http(s) URL for type "${ep.type}"`);
    });
  }

  if (!Array.isArray(data.use_when) || data.use_when.length === 0) err('use_when must list at least one concrete situation');
  if (data.avoid_when !== undefined && !Array.isArray(data.avoid_when)) err('avoid_when must be an array');

  if (!isDate(data.added)) err('added must be a YYYY-MM-DD date');
  if (data.metrics) {
    if (data.metrics.checked != null && !isDate(data.metrics.checked)) err('metrics.checked must be YYYY-MM-DD');
    if (data.metrics.stars != null && !Number.isInteger(data.metrics.stars)) err('metrics.stars must be an integer');
  }

  // A review date is required: it is what tells a reader, and the weekly
  // refresh, whether the judgement fields have been checked recently.
  if (!data.review || !isDate(data.review.date)) {
    err(`review.date is required - once the entry is right, run: node scripts/review.mjs ${data.id}`);
  } else {
    if (data.review.date > today) err('review.date is in the future');
    for (const k of Object.keys(data.review)) if (!['date', 'baseline'].includes(k)) err(`unknown review field "${k}"`);
    if (data.review.baseline !== undefined && (typeof data.review.baseline !== 'object' || Array.isArray(data.review.baseline))) {
      err('review.baseline must be an object - regenerate it with scripts/review.mjs');
    }
  }

  if (data.watch !== undefined) {
    const w = data.watch;
    if (typeof w !== 'object' || Array.isArray(w)) err('watch must be an object');
    else {
      for (const k of Object.keys(w)) if (!['paths', 'headings'].includes(k)) err(`unknown watch field "${k}"`);
      if (w.paths !== undefined && (!Array.isArray(w.paths) || w.paths.some((p) => typeof p !== 'string' || !p))) {
        err('watch.paths must be an array of path patterns');
      }
      if (w.headings !== undefined) {
        if (!Array.isArray(w.headings)) err('watch.headings must be an array');
        else w.headings.forEach((h, i) => {
          if (typeof h?.file !== 'string' || !h.file) err(`watch.headings[${i}].file is required`);
          if (!Number.isInteger(h?.level) || h.level < 1 || h.level > 6) err(`watch.headings[${i}].level must be 1-6`);
        });
      }
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s) found:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nSee docs/adding-a-source.md for the field-by-field guide.\n');
  process.exit(1);
}
console.log(`catalog ok - ${seenIds.size} source(s) valid`);
