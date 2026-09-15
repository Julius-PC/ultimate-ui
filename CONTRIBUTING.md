# Contributing

Fork it, change it, open a pull request. Sources and skills are both meant to
grow — the repository is designed around that, not retrofitted for it.

No dependencies to install. Node 18+ is the only requirement.

```bash
node scripts/validate.mjs && node scripts/build.mjs
```

## Adding a source to the catalog

```bash
node scripts/add-source.mjs https://github.com/owner/repo
```

That pre-fills everything the GitHub API knows and probes for agent entrypoints.
You fill in the judgement: what it is good for, what it is bad for, and how an
agent actually pulls data from it.

Full field-by-field guide: [`docs/adding-a-source.md`](docs/adding-a-source.md).
Full curation procedure: [`skills/catalog-curator/SKILL.md`](skills/catalog-curator/SKILL.md).

**Does it belong?** Yes if an agent building UI would be meaningfully worse off
not knowing it exists — open source, maintained, agent-consumable, and distinct
from what is already indexed. Star count is not a criterion.

**The field that matters most is `avoid_when`.** An entry with no honest limits
reads as advertising, and skills consuming the catalog will over-recommend it.

## Adding a skill

New directory under `skills/`, a `SKILL.md` with frontmatter, a row in the
README table. Guide: [`docs/writing-a-skill.md`](docs/writing-a-skill.md).

The one rule: **do not restate what an upstream source already says.** Route to
it and fetch it live. A paraphrase is worse than the original and drifts from it.

Looking for something to build? [`docs/skill-ideas.md`](docs/skill-ideas.md) has
fifteen proposals with real design sketches.

## Adding a vocabulary term

`capabilities`, `stacks` and `style_tags` are closed vocabularies in
`catalog/taxonomy.json`, enforced by the validator. Need a term that is not
there? Add it **with a definition**, in the same pull request. That is a normal
and welcome change.

## Attribution is not optional

Every source names its author and license. Every skill credits what it routes to.
`CREDITS.md` is generated from the catalog so it cannot drift.

This repository does not vendor upstream content — no copied components, no
mirrored docs. We link and describe. See
[`docs/attribution-policy.md`](docs/attribution-policy.md).

**If you maintain an indexed project and want your entry changed or removed,**
open an issue. We will act on it, without debate.

## Before you open the PR

```bash
node scripts/review.mjs <your-id>  # record that you checked the entry against upstream
node scripts/validate.mjs        # schema + vocabulary
node scripts/build.mjs           # regenerate index.json, CREDITS.md, README table
node scripts/search.mjs --id <your-id>
```

Commit the regenerated files. CI runs `build.mjs --check` and fails the PR if
they are stale.

- [ ] Validation passes.
- [ ] For a source: `review` recorded with `scripts/review.mjs` after the entry was finished.
- [ ] Generated files committed.
- [ ] Every URL you added returns 200, with `verified` set to today.
- [ ] Attribution complete, including the original creator where a repo sits under an org.
- [ ] No upstream content copied into this repository.

## Reviewing

Catalog PRs are reviewed against the checklist at the end of
[`skills/catalog-curator/SKILL.md`](skills/catalog-curator/SKILL.md). Reviewers
verify entrypoint URLs themselves — a dead entrypoint sends agents confidently at
a 404, which is worse than an omission.

## Conduct

Be decent. Assume good faith. Critique entries, not people. Maintainers of
indexed projects get the benefit of the doubt and the final word on how they are
described.
