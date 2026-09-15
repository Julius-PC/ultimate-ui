---
name: catalog-curator
description: Add, update, audit, or remove a source in this repository's catalog - researching the upstream project, verifying its agent entrypoints actually work, writing a schema-valid entry with correct attribution, and regenerating the derived files. Use when someone proposes a new UI repo to index, when an existing entry looks stale, or when reviewing a pull request that touches catalog/sources/.
---

# Catalog Curator

This is the skill that keeps the repository alive. Every other skill is only as
good as the catalog underneath it, and a catalog nobody maintains becomes a list
of dead links inside a year.

## What belongs in the catalog

A source earns an entry if an agent building UI would be **meaningfully worse off
not knowing about it**. That means:

- **Open source**, with a license we can name.
- **Maintained** — commits within roughly the last year, or a stable, finished
  thing that does not need them (a curated list can be quiet; a framework cannot).
- **Agent-consumable** — there is some way to fetch real data from it:
  `llms.txt`, a registry JSON, raw markdown, a documented API, a CLI. A project
  with only a rendered marketing site is close to useless to an agent.
- **Distinct** — it does something no existing entry does. The tenth React
  component library is noise; the first Svelte one is signal.

Reject: closed-source products, abandoned repos, anything with an unclear
license, and anything that duplicates an existing entry without a clear reason
to prefer it.

Star count is not a criterion. It measures past attention, not present fit.

## Adding a source

### 1. Scaffold

```bash
node scripts/add-source.mjs https://github.com/owner/repo
```

This fills in everything the GitHub API knows - name, license, owner, homepage,
stars - and probes for an `llms.txt` and a README. It deliberately leaves the
judgement fields as `TODO`. Do not let those ship.

### 2. Actually read the project

Do not write an entry from the repo description. Read:

```bash
curl -s https://raw.githubusercontent.com/<owner>/<repo>/<branch>/README.md
curl -s "https://api.github.com/repos/<owner>/<repo>/git/trees/<branch>?recursive=1" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>JSON.parse(d).tree.filter(x=>x.type==='blob').slice(0,150).forEach(x=>console.log(x.path)))"
```

The file tree tells you what the project really is far faster than the README,
which is written to persuade.

### 3. Find the agent entrypoints — the part that matters

This field is what separates this catalog from a bookmark folder. Probe, in
roughly this order:

```bash
# llms.txt is increasingly standard - check both the root and product paths
for u in https://site/llms.txt https://site/<product>/llms.txt; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L "$u")  $u"
done

# machine-readable component registries
curl -s -o /dev/null -w '%{http_code}\n' https://site/r/index.json

# raw markdown in the repo itself
curl -s -o /dev/null -w '%{http_code}\n' "https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>"
```

**Verify every URL returns 200 before you commit it**, and set `verified` to
today's date. An entrypoint listed but not checked is worse than no entrypoint -
it sends an agent confidently at a 404.

Use `{placeholder}` syntax for path patterns, and say in `what` which values are
valid. `https://site/r/styles/{style}/{component}.json` with an example beats a
single hard-coded URL.

### 4. Write the judgement fields

These are the ones a human has to get right:

- **`kind`** — one enum value. What shape is this project?
- **`capabilities`** — terms from `catalog/taxonomy.json` only. Needs a new term?
  Add it there with a definition, in the same PR. The validator enforces this,
  which is what stops the vocabulary rotting into synonyms.
- **`stacks`** — `[]` or `["stack-agnostic"]` if it does not care.
- **`style_tags`** — only if it carries an aesthetic opinion. A neutral toolkit
  gets `["neutral"]`. Over-tagging makes style search useless.
- **`use_when`** — concrete situations, not features. "You need a data grid with
  virtualised rows" beats "provides tables".
- **`avoid_when`** — **the most valuable field in the file.** Where is this the
  wrong tool? An entry with no `avoid_when` reads as advertising, and agents
  reading the catalog will over-recommend it. Every real tool has limits; find them.
- **`summary`** — prefer the maintainers' own framing. They know what they built.
- **`watch`** — if the entry lists things upstream will add more of (skills,
  brand profiles, sections of a list), watch them, so a new one flags a review
  instead of silently making `provides` wrong. See `docs/adding-a-source.md`.

### 5. Attribution

Non-negotiable. See `docs/attribution-policy.md`.

- `author.name` / `author.url` — the GitHub owner.
- `author.credit_note` — if the repo moved to an org but a person created it,
  credit them here. `shadcn-ui` and `Comfy-Org` are both examples in the catalog.
- `license` — the real SPDX id. `NOASSERTION` if genuinely unclear, and add a
  `notes` line explaining what is unclear.
- `notes` — flag anything a user should know before depending on it: a copyleft
  license, an open-core model, third-party assets under separate terms.

Never copy substantial content from the upstream repo into this one. We index and
link. That is the whole licensing posture, and it is what keeps this simple.

### 6. Record the review, validate, build, verify

Once every field is right, record the review. It snapshots upstream so future
drift can be detected:

```bash
node scripts/review.mjs <new-id>
```

```bash
node scripts/validate.mjs
node scripts/build.mjs
node scripts/search.mjs --id <new-id>
```

Then confirm the entry is actually reachable through the queries a skill would
run. An entry that only surfaces when you search its own id is mis-tagged:

```bash
node scripts/search.mjs --capability <its-main-capability>
node scripts/search.mjs --stack <its-stack>
```

Commit the regenerated `catalog/index.json`, `CREDITS.md` and `README.md`. CI runs
`build.mjs --check` and will fail the PR if they are stale.

## Auditing existing entries

Freshness is tracked automatically. Every source carries a generated `upstream`
block — last commit, default branch, archived flag — refreshed by:

```bash
node scripts/refresh.mjs
```

```bash
node scripts/refresh.mjs --report
```

The report form changes nothing and prints every source sorted by how recently
it was committed to, flagging anything that needs a decision: an archived
upstream, a license that changed under us, a repo that moved, or a project with
no pushes in over a year.

A weekly GitHub Action (`.github/workflows/refresh.yml`) runs this, commits the
refreshed data to main, and keeps one Issue - *Catalog: upstream changes need
review* - listing everything that needs a person. It comments when something new
appears and closes the Issue once the list is empty.

There are two kinds of flag, and they clear differently.

**Health flags clear when you fix the entry:**

| Flag | What to actually do |
| --- | --- |
| `LICENSE CHANGED` | Read the new license. Update `license`, and add a `notes` line if it now constrains use. |
| `upstream is ARCHIVED` | Usually remove, unless it is a finished thing that needs no commits. Say which in `notes`. |
| `no pushes since DATE` | Judgement. A curated list can be quiet and fine; a framework going quiet is a signal. |
| `repo moved to X` | Update `repo`, `author`, and every `raw_path` entrypoint that embeds the old owner. |
| `dead entrypoint` | Find the new URL or drop the entrypoint, and refresh its `verified` date. |

**Review flags clear when you re-check the entry and run `review.mjs`:**

| Flag | What to actually do |
| --- | --- |
| `N new in <watched> since review` | Read the new items. Add them to `provides`, and reconsider `use_when` if they widen what the project is for. |
| `N removed from <watched>` | Remove them from `provides`, and from any skill that routes to them by name. |
| `new major version` | Skim the release notes. Major versions are where `avoid_when` goes wrong - an old limit fixed, or a new one introduced. |
| `description changed` / `homepage changed` | The project may have reframed itself. Re-read `summary` and `kind`. |
| `review overdue` | Nothing specific flagged it, so re-read the entry against the project anyway. That is the point of the backstop. |
| `never reviewed` / `no review baseline yet` | Check the entry, then record the review. |

Then record the review. It prints what you are acknowledging, so you can confirm
nothing was skipped:

```bash
node scripts/review.mjs <id>
```

Reviewing an entry and changing nothing is a legitimate outcome. Running
`review.mjs` without reading the project is not: it silences the flags and hides
exactly the drift they were raised to surface.

Then confirm the entrypoints still resolve, and refresh their `verified` dates:

```bash
node scripts/check-links.mjs
```

## Removing a source

Removal is normal maintenance, not a judgement on the authors. Delete the file,
rebuild, and grep the skills for references to its id - a skill citing a source
that no longer exists is a broken link inside a broken recommendation.

```bash
rm catalog/sources/<id>.json
grep -rn "<id>" skills/ docs/ README.md
node scripts/build.mjs
```

If a maintainer asks for their project to be removed, remove it. No debate.

## Reviewing a catalog pull request

Checklist:

- [ ] `node scripts/validate.mjs` passes.
- [ ] `review` was recorded with `scripts/review.mjs` after the entry was finished.
- [ ] Generated files are current (`node scripts/build.mjs --check`).
- [ ] Every `agent_entrypoints` URL returns 200, and `verified` is set.
- [ ] `avoid_when` is present and honest, not a humblebrag.
- [ ] License matches the upstream repo right now.
- [ ] Attribution is complete, including `credit_note` where a person is behind an org.
- [ ] It does something no existing entry does.
- [ ] No upstream content was copied into this repo.
- [ ] New taxonomy terms, if any, come with definitions in the same PR.

## Credits

Every source in the catalog is the work of its own authors, listed with license
and link in [`CREDITS.md`](../../CREDITS.md), which this repository generates from
the catalog so it can never drift out of date.
