# Ultimate UI

*Working name — see [Naming](#naming).*

**An open catalog of the best open-source UI resources, plus skills that let a
coding agent actually use them.**

Point an agent at this repository and it can pick a visual direction, recreate a
reference design, generate mockups worth comparing, source real components
instead of hand-rolling them, and review what it built — each step backed by
work from projects that already solved the problem.

Two layers, and the second is the point:

1. **A catalog.** One schema-validated file per indexed project, recording not
   just a link but *how an agent pulls real data from it* — `llms.txt` digests,
   component registries, raw design documents, CLIs. Every URL is verified, and
   every entry records how recently its upstream was committed to.
2. **Skills that query it.** Procedures that turn a vague brief into a decision,
   fetch from the real upstream source, and credit whoever wrote it.

Everything indexed here belongs to its authors. This repository links and
describes; it never vendors, forks, or re-licenses their work.
[Credits below](#credits), and the full policy in
[`docs/attribution-policy.md`](docs/attribution-policy.md).

**Fork it, add a source, add a skill, open a PR** — see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Install

No dependencies. Node 18 or newer is the only requirement.

```bash
git clone https://github.com/Julius-PC/ultimate-ui.git
```

```bash
cd ultimate-ui && node scripts/validate.mjs
```

### Use it with a coding agent

The skills are plain markdown with frontmatter, so any agent that reads skill
files can use them. Clone the repo somewhere your agent can see, or copy the
`skills/` directory into your project:

```bash
cp -r ultimate-ui/skills/* your-project/.claude/skills/
```

Then ask for what you want — *"give me three mockups for the settings page"*,
*"make this look like Linear"*, *"review this UI"* — and the matching skill
picks itself up from its description.

To use the catalog without the skills, read
[`catalog/index.json`](catalog/index.json). It carries every entry plus
pre-built lookups by capability, stack, and style.

---

## Skills

<!-- skills-table:start -->
| Skill | What it does |
| --- | --- |
| [`catalog-curator`](skills/catalog-curator/SKILL.md) | Add, update, audit, or remove a source in this repository's catalog - researching the upstream project, verifying its agent entrypoints actually work, writing a schema-valid entry with correct attribution, and regenerating the derived files. |
| [`component-sourcing`](skills/component-sourcing/SKILL.md) | Find the best existing implementation of a UI component across the indexed libraries instead of hand-rolling one - checking the project's own codebase first, then the catalog's registries. |
| [`design-clone`](skills/design-clone/SKILL.md) | Take a reference website, screenshot, or design file and work out how to rebuild its look in the user's own stack - extracting the underlying design system (palette, type scale, spacing rhythm, motion, component patterns) into a reusable design document plus a concrete build plan. |
| [`design-system-init`](skills/design-system-init/SKILL.md) | Bootstrap a real design system into a codebase - design tokens in the project's native format, a themed component layer, dark mode, and a DESIGN.md the rest of the work reads from. |
| [`mockup-studio`](skills/mockup-studio/SKILL.md) | Generate several genuinely different visual directions for a screen or flow as self-contained HTML mockups the user can click through and compare side by side, before any real code is written. |
| [`motion-pass`](skills/motion-pass/SKILL.md) | Add, fix, or remove animation in an interface - choosing curve, duration, and animated properties deliberately, and deciding what should not move at all. |
| [`style-scout`](skills/style-scout/SKILL.md) | Turn a loose description of a desired look ("clean and technical", "like Linear but warmer", "premium, dark, not corporate") into a concrete, written style brief plus the specific catalog sources, brand design languages, component libraries and guides that fit it. |
| [`ui-review`](skills/ui-review/SKILL.md) | Audit UI that already exists against its own design language, accessibility requirements, responsive behaviour, and the states real products hit - producing a prioritised, fixable list rather than a vague impression. |
<!-- skills-table:end -->

Browse them from the command line:

```bash
node scripts/skills.mjs
```

```bash
node scripts/skills.mjs --full
```

Find which skills draw on a given source:

```bash
node scripts/skills.mjs --source emilkowalski-skills
```

Machine-readable catalog of skills, generated from their frontmatter:
[`skills/index.json`](skills/index.json).

Fifteen more proposed skills, each with a real design sketch, in
[`docs/skill-ideas.md`](docs/skill-ideas.md) — good first contributions.

---

## Catalog

<!-- catalog-table:start -->
| Source | Author | Kind | Good for | License |
| --- | --- | --- | --- | --- |
| [Ant Design](https://github.com/ant-design/ant-design) | [Ant Design](https://github.com/ant-design) | Component library | components, theming, design-tokens | MIT |
| [Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md) | [VoltAgent](https://github.com/VoltAgent) | Design language | design-language, design-tokens, color | MIT |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | [Comfy Org](https://github.com/Comfy-Org) | Generative tool | image-generation, asset-sourcing, prototyping | GPL-3.0 |
| [Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers) | [Brad Traversy](https://github.com/bradtraversy) | Curated list | asset-sourcing, inspiration, iconography | MIT |
| [Skills For Designers and Engineers](https://github.com/emilkowalski/skills) | [Emil Kowalski](https://github.com/emilkowalski) | Agent skills | motion, agent-guidance, code-review | MIT |
| [Material UI](https://github.com/mui/material-ui) | [MUI](https://github.com/mui) | Component library | components, theming, design-tokens | MIT |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | [shadcn-ui](https://github.com/shadcn-ui) | Component library | components, primitives, theming | MIT |
| [Storybook](https://github.com/storybookjs/storybook) | [Storybook](https://github.com/storybookjs) | Workshop tool | component-workshop, documentation, visual-testing | MIT |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | [nextlevelbuilder](https://github.com/nextlevelbuilder) | Agent skills | design-language, design-tokens, theming | MIT |
<!-- catalog-table:end -->

Every entry also records `use_when`, `avoid_when`, and verified agent
entrypoints. Query it:

```bash
node scripts/search.mjs --style dark-first --stack react
```

```bash
node scripts/search.mjs --list
```

```bash
node scripts/search.mjs --id shadcn-ui --json
```

---

## Freshness

Upstream projects move. The catalog records how recent each project's last
commit was at the time we checked, so nobody has to guess whether an entry is
still current.

<!-- freshness-table:start -->
| Source | Last upstream commit | Age when checked | Stars | Checked |
| --- | --- | --- | --- | --- |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | 2026-08-29 | same day | 130,493 | 2026-08-29 |
| [Storybook](https://github.com/storybookjs/storybook) | 2026-08-28 | same day | 90,958 | 2026-08-29 |
| [Ant Design](https://github.com/ant-design/ant-design) | 2026-08-28 | same day | 99,255 | 2026-08-29 |
| [Material UI](https://github.com/mui/material-ui) | 2026-08-28 | 1 day | 98,958 | 2026-08-29 |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 2026-08-27 | 2 days | 122,611 | 2026-08-29 |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | 2026-08-26 | 3 days | 122,447 | 2026-08-29 |
| [Skills For Designers and Engineers](https://github.com/emilkowalski/skills) | 2026-08-21 | 8 days | 33,282 | 2026-08-29 |
| [Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md) | 2026-07-31 | 28 days | 111,111 | 2026-08-29 |
| [Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers) | 2026-05-24 | 97 days | 66,770 | 2026-08-29 |
<!-- freshness-table:end -->

Refresh it yourself — this rewrites the `upstream` block in every source file:

```bash
node scripts/refresh.mjs
```

Read-only version, which changes nothing:

```bash
node scripts/refresh.mjs --report
```

Verify every agent entrypoint still resolves:

```bash
node scripts/check-links.mjs
```

**Automated.** A [scheduled workflow](.github/workflows/refresh.yml) runs weekly,
refreshes the upstream data, and opens a pull request when anything changed. A
human still reviews it — an archived repo, a license change, or a project going
quiet are judgement calls, not things a script should quietly paper over.
`scripts/refresh.mjs --strict` exits non-zero when something needs that judgement.

---

## Commands

| Command | What it does |
| --- | --- |
| `node scripts/skills.mjs` | Browse the skill catalog |
| `node scripts/search.mjs` | Query the source catalog |
| `node scripts/add-source.mjs <url>` | Scaffold a new catalog entry from a GitHub URL |
| `node scripts/refresh.mjs` | Update upstream freshness from the GitHub API |
| `node scripts/check-links.mjs` | Verify every agent entrypoint still resolves |
| `node scripts/validate.mjs` | Check the catalog against schema and taxonomy |
| `node scripts/build.mjs` | Regenerate `catalog/index.json`, `skills/index.json`, `CREDITS.md`, this README |

Also available as `npm run search`, `npm run build`, and so on.

---

## How it fits together

```
catalog/sources/*.json   ← hand-written, one file per project
        │  refresh.mjs   → upstream freshness from the GitHub API
        │  validate.mjs  → schema + controlled vocabulary
        │  build.mjs     → aggregate
        ▼
catalog/index.json · skills/index.json · CREDITS.md · README tables   ← generated
        │
        ▼
skills/*/SKILL.md        ← procedures that query the catalog
```

Details, and why each choice was made:
[`docs/architecture.md`](docs/architecture.md).

---

## Adding to it

The repository is built to grow. Nothing is coupled to the current set of
sources or skills.

| To add | Read |
| --- | --- |
| A source | [`docs/adding-a-source.md`](docs/adding-a-source.md) |
| A skill | [`docs/writing-a-skill.md`](docs/writing-a-skill.md) |
| A vocabulary term | Add it to [`catalog/taxonomy.json`](catalog/taxonomy.json) with a definition, in the same PR |

Adding a source takes about five minutes:

```bash
node scripts/add-source.mjs https://github.com/owner/repo
```

That pre-fills everything the GitHub API knows and probes for agent entrypoints.
You supply the judgement: what it is good for, what it is bad for, and how an
agent actually pulls data from it.

The full curation procedure — how to research a project, verify its entrypoints,
and review someone else's entry — lives in
[`skills/catalog-curator/SKILL.md`](skills/catalog-curator/SKILL.md).

---

## Credits

Every project below is the work of its own authors and maintainers, published
under its own license. This repository indexes and links to them. It does not
vendor, fork, or re-license their content.

<!-- credits-table:start -->
| Project | Author | License |
| --- | --- | --- |
| [Ant Design](https://github.com/ant-design/ant-design) | [Ant Design](https://github.com/ant-design) | MIT |
| [Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md) | [VoltAgent](https://github.com/VoltAgent) | MIT |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | [Comfy Org](https://github.com/Comfy-Org) <sub>Created by comfyanonymous.</sub> | GPL-3.0 |
| [Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers) | [Brad Traversy](https://github.com/bradtraversy) | MIT |
| [Skills For Designers and Engineers](https://github.com/emilkowalski/skills) | [Emil Kowalski](https://github.com/emilkowalski) | MIT |
| [Material UI](https://github.com/mui/material-ui) | [MUI](https://github.com/mui) | MIT |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | [shadcn-ui](https://github.com/shadcn-ui) <sub>Created by shadcn.</sub> | MIT |
| [Storybook](https://github.com/storybookjs/storybook) | [Storybook](https://github.com/storybookjs) | MIT |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | [nextlevelbuilder](https://github.com/nextlevelbuilder) | MIT |
<!-- credits-table:end -->

Per-source detail, licenses, and notes: [`CREDITS.md`](CREDITS.md) — generated
from the catalog, so it cannot drift out of sync.

**If you maintain one of these projects and want the entry changed or removed,**
[open an issue](../../issues/new/choose) and we will act on it, without debate.

---

## Naming

`ultimate-ui` is a placeholder. The name should be short, not claim to be the
last word on anything, and survive the catalog reaching a hundred entries. Open
an issue with a proposal.

Renaming is cheap: the name appears in `README.md`, `package.json`, and
`catalog/schema.json`'s `$id`. Nothing else depends on it.

---

## License

MIT — see [`LICENSE`](LICENSE).

That covers **this repository's** catalog metadata, skills, scripts, and docs.
It does not cover the indexed projects. Anything you fetch from a source arrives
under that source's license, and third-party assets reached through a curated
list carry the terms of wherever they live. Two cases worth knowing: ComfyUI is
GPL-3.0, unlike the rest of the catalog; and curated lists link onward to assets
with their own terms. Details in
[`docs/attribution-policy.md`](docs/attribution-policy.md).
