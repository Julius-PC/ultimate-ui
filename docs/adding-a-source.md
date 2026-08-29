# Adding a source

The short version:

```bash
node scripts/add-source.mjs https://github.com/owner/repo
$EDITOR catalog/sources/<id>.json     # fill in the TODOs
node scripts/validate.mjs && node scripts/build.mjs
```

Open a pull request with the source file **and** the regenerated
`catalog/index.json`, `CREDITS.md` and `README.md`. CI fails if they are stale.

For the full curation procedure - including how to research a project properly
and how to review someone else's entry - see
[`skills/catalog-curator/SKILL.md`](../skills/catalog-curator/SKILL.md).

## Does it belong?

Yes, if an agent building UI would be meaningfully worse off not knowing it
exists. Concretely: open source, maintained, agent-consumable (there is some way
to fetch real data from it), and distinct from what is already indexed.

No, if it is closed source, abandoned, unclearly licensed, or the tenth thing in
a category already covered.

Star count is not a criterion.

## Field by field

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Lowercase kebab-case, must match the filename. **Never change it after merge** - skills reference it. |
| `name` | yes | Spelled the way the authors spell it. |
| `repo` | yes | Canonical repository URL. |
| `homepage` | | Docs site or product page, or `null`. |
| `author` | yes | `name` + `url`. Add `credit_note` when a person created something that now lives under an org. |
| `license` | yes | Real SPDX id. `NOASSERTION` only if genuinely unclear, and explain in `notes`. |
| `license_url` | | Direct link to the license file. |
| `summary` | yes | 20–400 chars. Prefer the maintainers' own framing. |
| `kind` | yes | One of: `component-library`, `curated-list`, `agent-skills`, `design-language`, `workshop-tool`, `generative-tool`. |
| `capabilities` | yes | Terms from `catalog/taxonomy.json` only. |
| `stacks` | | Same. `[]` or `["stack-agnostic"]` if it does not care. |
| `style_tags` | | Same. Only if it carries an aesthetic opinion. |
| `agent_entrypoints` | yes | See below. The most important field. |
| `use_when` | yes | Concrete situations, not a feature list. |
| `avoid_when` | | See below. Effectively required in review. |
| `provides` | | Named units: skills, brand profiles, sections. |
| `metrics` | | Point-in-time star count. Never used for ranking. |
| `added` | yes | `YYYY-MM-DD`. |
| `notes` | | Licensing quirks, category mismatches, anything a user should know first. |

## `agent_entrypoints`

This is what makes the catalog usable rather than decorative. Each entry says how
an agent pulls real data:

```json
{
  "type": "registry_json",
  "url": "https://ui.shadcn.com/r/styles/{style}/{component}.json",
  "what": "The actual source of one component for one style, e.g. .../new-york-v4/button.json.",
  "verified": "2026-08-28"
}
```

Rules:

- **Check every URL returns 200 before committing**, and set `verified` to that
  date. An unverified entrypoint sends an agent confidently at a 404, which is
  worse than omitting it.
- Use `{placeholders}` for patterns, and give a working example in `what`.
- Prefer machine-readable sources: `llms_txt` and `registry_json` over `docs_url`.
- `what` should say what comes back *and* when to reach for it.

Where to look: `/llms.txt` at the site root and at product paths, a
`/r/index.json` style registry, raw markdown in the repo, a documented CLI.

## `avoid_when`

The field reviewers care about most. Where is this the wrong tool?

An entry without one reads as advertising, and skills consuming the catalog will
over-recommend it. Every real tool has limits. Examples from the current catalog:

> "The project is not React-based - the registry assumes React component files."

> "The brief calls for a distinctive look - Material UI reads as Material unless
> you invest real effort in the theme."

> "You need licensing certainty for a linked asset. Always check the destination's
> own terms before shipping anything from it."

## Taxonomy terms

`capabilities`, `stacks` and `style_tags` are closed vocabularies defined in
`catalog/taxonomy.json`, and the validator rejects anything else. This is
deliberate - it is what stops `a11y` and `accessibility` both existing and search
silently returning half the answer.

Need a term that does not exist? Add it to `catalog/taxonomy.json` **with a
definition**, in the same pull request. That is a normal, welcome change.

```bash
node scripts/search.mjs --list   # see the current vocabulary
```

## Before opening the pull request

```bash
node scripts/validate.mjs
node scripts/build.mjs
node scripts/search.mjs --id <your-id>
node scripts/search.mjs --capability <its-main-capability>   # is it actually findable?
```

If the entry only surfaces when you search its own id, it is mis-tagged. Fix the
tags rather than shipping something no skill will ever reach.
