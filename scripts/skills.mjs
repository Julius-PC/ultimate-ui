#!/usr/bin/env node
// Browse the skill catalog.
//
//   node scripts/skills.mjs                    # list every skill
//   node scripts/skills.mjs --full             # full descriptions
//   node scripts/skills.mjs motion             # search name + description
//   node scripts/skills.mjs --source shadcn-ui # which skills route to a source
//   node scripts/skills.mjs --json
import { loadSkills, loadSources } from './lib.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(`--${f}`);
const flag = (f) => { const i = args.indexOf(`--${f}`); return i === -1 ? null : args[i + 1]; };
const query = args.find((a) => !a.startsWith('--') && a !== flag('source'))?.toLowerCase();

const byId = Object.fromEntries(loadSources().map(({ data }) => [data.id, data]));
let skills = loadSkills(byId);

const wantSource = flag('source');
if (wantSource) {
  if (!byId[wantSource]) {
    console.error(`Unknown source "${wantSource}". Run: node scripts/search.mjs --json`);
    process.exit(2);
  }
  skills = skills.filter((s) => s.uses.includes(wantSource));
}
if (query) skills = skills.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(query));

if (has('json')) { console.log(JSON.stringify(skills, null, 2)); process.exit(0); }

if (!skills.length) { console.log('No skills matched.'); process.exit(0); }

const wrap = (text, width, indent) =>
  text.split(' ').reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if ((last + ' ' + word).trim().length > width) lines.push(indent + word);
    else lines[lines.length - 1] = (last + ' ' + word).trim().padStart(last.length ? 0 : indent.length);
    return lines;
  }, [indent]).join('\n');

for (const s of skills) {
  console.log(`\n\x1b[1m${s.name}\x1b[0m`);
  const desc = has('full') ? s.description : s.description.split(/(?<=\.)\s/)[0];
  console.log(wrap(desc, 88, '  '));
  if (s.uses.length) console.log(`  \x1b[2mroutes to: ${s.uses.join(', ')}\x1b[0m`);
  console.log(`  \x1b[2m${s.file}\x1b[0m`);
}
console.log(`\n${skills.length} skill(s). Add --full for complete descriptions, --json for machine-readable.`);
