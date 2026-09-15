# Architecture

Two layers, one rule between them.

```
catalog/sources/*.json   ← hand-written. One file per indexed project.
        │
        │  scripts/refresh.mjs    writes back the `upstream` freshness block
        │  scripts/review.mjs     records a person's review and an upstream baseline
        │  scripts/validate.mjs   enforces schema + taxonomy
        │  scripts/build.mjs      aggregates
        ▼
catalog/index.json       ← generated. What skills read.
skills/index.json        ← generated from SKILL.md frontmatter.
CREDITS.md               ← generated. Attribution, always in sync.
README.md (4 blocks)     ← generated: skills, catalog, freshness, credits.
        │
        ▼
skills/*/SKILL.md        ← hand-written. Procedures that query the catalog.
```

**The rule: this repository never vendors upstream content.** No copied
components, no forked docs, no mirrored markdown. Entries describe a project and
record how to fetch from it live. That is what keeps licensing simple, keeps the
catalog from going stale the day it is written, and keeps the repo small.

## Why one file per source

A single `sources.json` would conflict on every concurrent pull request. One file
per source means two people can add two projects the same afternoon and neither
rebases. The build step reassembles them, so consumers still get one fetch.

## Why a generated index

Skills need the whole catalog to make a recommendation, and they should not have
to glob a directory or make nine requests to get it. `catalog/index.json` carries
every entry plus pre-built reverse maps (`by_capability`, `by_stack`,
`by_style_tag`) so a skill can go from a brief to a shortlist in one read.

It is committed rather than built on demand so that anything fetching this
repository raw - an agent, a CDN, a script - gets a working index without a build
step. CI enforces that it matches its sources.

## Why a controlled vocabulary

`catalog/taxonomy.json` is the only place capability, stack, and style terms are
defined, and the validator rejects anything else. Without it the catalog
accumulates `a11y` and `accessibility` and `accessible`, and search silently
returns half the truth. Adding a term is a normal pull request; the cost is one
definition, and the payoff is that filters keep working at a hundred entries.

## `agent_entrypoints` is the important field

Most awesome-lists give you a name and a link, which leaves an agent to guess how
to actually use the thing. Every entry here records concrete ways to pull real
data:

| Type | Meaning |
| --- | --- |
| `llms_txt` | An agent-oriented docs digest. |
| `registry_json` | A machine-readable component or token index. |
| `raw_path` | A `raw.githubusercontent.com` path or pattern. |
| `docs_url` | Human documentation, when nothing better exists. |
| `cli` | A command that does the thing. |
| `mcp` | An MCP server. |
| `api` | Any other HTTP API. |

Patterns use `{placeholders}` with valid values described in `what`. Each carries
a `verified` date, because a URL that worked eighteen months ago is a guess.

## Freshness is recorded, not asserted

An index of other people's repositories is only trustworthy if it says how stale
it might be. Every entry carries a generated `upstream` block — last commit,
default branch, archived flag, and the date checked — written by
`scripts/refresh.mjs` from the GitHub API and surfaced in the README.

A weekly Action refreshes it and splits the result in two. The facts - star
counts, commit dates, releases, the archived flag - are committed straight to
main, because they change every week and a weekly pull request of star counts
trains people to approve without reading. Everything that needs a person goes
into one Issue the workflow keeps current: it rewrites the body to the live list
each week, comments only when something new appears, and closes the Issue when
the list empties.

The separation matters. `refresh.mjs` only ever writes the generated fields —
`upstream` and `metrics`. It never touches `use_when`, `avoid_when`, `review`, or anything else a person
decided.

## Judgement goes stale too, so entries carry a review date

A script can refresh facts. It cannot refresh judgement - `use_when`,
`avoid_when`, `provides`, the summary - but it can notice when those have
probably gone stale.

Every entry carries a `review` block: the date a person last re-read the
project, and a `baseline` snapshot of upstream at that moment - description,
homepage, major version, and the contents of anything listed in `watch`.
`scripts/review.mjs` writes both, and nothing else does.

Each week `refresh.mjs` compares upstream against that baseline and flags:

| Drift | Why it matters |
| --- | --- |
| Items added to or removed from a watched folder or section | `provides` is probably out of date |
| A new major version | `use_when` and `avoid_when` may describe the old version |
| A reworded description or new homepage | the project may have changed what it is |
| No review in 180 days | a backstop for changes no signal catches |

`watch` is opt-in and hand-written, because only a curator knows which parts of a
repository the entry actually describes. Pre-1.0 projects don't flag on minor
versions, since they bump them routinely.

Two rules keep this usable:

- **Flags persist until resolved.** They compare against the review baseline,
  not last week's data, so an ignored flag does not quietly disappear.
- **Flag text is stable week to week** - "no pushes since 2025-06-01", never
  "no pushes in 367 days". The workflow diffs flag lines to decide whether
  anything is new enough to notify about, so text that drifts on its own would
  notify every week.

## The skills catalog is generated too

`skills/index.json` is built from each `SKILL.md`'s frontmatter, so the list of
skills cannot drift from the skills themselves. Its `uses` field is derived by
matching which catalog repo URLs a skill cites, which makes the relationship
navigable in both directions:

```bash
node scripts/skills.mjs --source emilkowalski-skills
```

CI fails the build if a skill has no description, or if its frontmatter `name`
disagrees with its directory.

## Skills are procedures, not knowledge

A skill's job is to route: work out what the situation calls for, query the
catalog, fetch from the real source, and apply it. Skills deliberately do **not**
restate what upstream sources already say - a paraphrase of Emil Kowalski's
animation rules would be worse than his rules and would drift from them. So
`motion-pass` tells you to fetch and read them.

This is also why every skill ends with a Credits section naming the sources it
routes to. The skills are glue; the substance belongs to the people who wrote it.

## Adding capability over time

| To add | Do this |
| --- | --- |
| A source | `node scripts/add-source.mjs <url>`, fill in judgement fields, validate, build |
| A vocabulary term | Add it to `catalog/taxonomy.json` with a definition, then use it |
| A skill | New directory under `skills/`, `SKILL.md` with frontmatter, add to README |
| A generated artefact | Extend `scripts/build.mjs`; CI's `--check` covers it automatically |
| A new entrypoint type | Extend the enum in `catalog/schema.json` and document it above |

Nothing here is coupled to the current nine sources or eight skills. Both lists
are meant to grow.
