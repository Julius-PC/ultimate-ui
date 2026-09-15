## What this changes

<!-- One or two sentences. -->

## Type

- [ ] New catalog source
- [ ] Catalog source update or removal
- [ ] New skill
- [ ] Skill update
- [ ] Tooling / docs

## Checks

```bash
node scripts/validate.mjs && node scripts/build.mjs
```

- [ ] Validation passes and generated files (`catalog/index.json`, `CREDITS.md`, `README.md`) are committed.

### If this touches `catalog/sources/`

- [ ] Every `agent_entrypoints` URL returns 200, with `verified` set to today (`node scripts/check-links.mjs <id>`).
- [ ] Ran `node scripts/review.mjs <id>` after finishing the entry, and added `watch` if it lists things upstream will add more of.
- [ ] `avoid_when` is present and honest.
- [ ] License matches the upstream repository right now.
- [ ] Attribution complete, including `author.credit_note` where a person created something now under an org.
- [ ] It does something no existing entry does.
- [ ] The entry is findable by capability/stack search, not only by its own id.

### If this touches `skills/`

- [ ] Frontmatter `name` matches the directory, and `description` states trigger conditions.
- [ ] Every command in the skill was run and works.
- [ ] The skill queries the catalog rather than hard-coding source names.
- [ ] Credits section lists every source it routes to, with author and license.
- [ ] Added to the skills table in `README.md`.

### Always

- [ ] No upstream content was copied into this repository. We link and describe.
