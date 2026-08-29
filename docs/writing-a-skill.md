# Writing a skill

A skill here is a **procedure**, not a knowledge dump. It decides what a
situation calls for, queries the catalog, fetches from the real upstream source,
and applies it.

## The layout

```
skills/<name>/
├── SKILL.md          # required
└── references/       # optional: long checklists, templates, tables
```

`SKILL.md` opens with frontmatter:

```yaml
---
name: kebab-case-name
description: What it does and - critically - when to use it. Write the trigger
  conditions in the language someone would actually use. This is what an agent
  reads to decide whether to load the skill at all.
---
```

The `description` is the whole routing mechanism. "Reviews UI" is useless.
"Use when UI technically works but feels off, before shipping a surface, or when
asked to review, critique, or check an interface" is a trigger.

## The one rule that matters

**Do not restate what an upstream source already says.**

A paraphrase of someone's animation rules is worse than their rules and drifts
from them the moment they update. Route to the source instead:

```bash
curl -s https://raw.githubusercontent.com/emilkowalski/skills/main/skills/animate/SKILL.md
```

The skill's value is knowing *when* to fetch that, what to do with it, and how it
combines with everything else. That is genuinely useful and nobody else has
written it down.

## Structure that works

1. **A sentence on why this is hard.** Grounds the rest.
2. **When to use / when not to use.** The second half is doing more work than
   the first - it stops the skill firing on tasks it will make worse.
3. **A numbered procedure.** Concrete steps with real, runnable commands.
4. **Output format.** Show the shape of the deliverable, with an example.
5. **Failure modes.** The specific ways this goes wrong. This section is
   consistently the highest-value part of a skill.
6. **Credits.** Every source you route to, with author and license.

## Query the catalog, do not hard-code it

Wrong - goes stale the day a source is added:

> Use shadcn/ui for React projects.

Right - stays correct as the catalog grows:

```bash
node scripts/search.mjs --capability components --stack react --json
```

Skills should keep working when the catalog reaches fifty entries. Naming
specific sources in prose is how that stops being true.

Exception: a concrete command as an *example* is fine and often clearer. Just
make sure the procedure is a query and the example is illustrative, not the
mechanism.

## Commands must run

Every command in a skill should be copy-pasteable and actually work. Run it
before committing. A skill full of plausible-looking commands that 404 is worse
than no skill, because it is confidently wrong.

Add commands as one-per-fence blocks so they are easy to run:

````
```bash
node scripts/search.mjs --list
```
````

## Credits are required

Every skill ends with:

```markdown
## Credits

- **[Project](https://github.com/owner/repo)** by [Author](https://github.com/owner) (LICENSE) —
  what you use it for.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
```

If a skill leans heavily on one upstream source, say so plainly at the top too -
see `motion-pass`, which exists mostly to route people to Emil Kowalski's
animation skills and says as much in its second paragraph.

## Before opening the pull request

- [ ] Frontmatter `name` matches the directory name.
- [ ] `description` states trigger conditions in natural language.
- [ ] Every command runs.
- [ ] Catalog queries used instead of hard-coded source names.
- [ ] Failure modes section is specific, not generic advice.
- [ ] Credits list every source the skill routes to, with license.
- [ ] Added to the skills table in `README.md`.
- [ ] No paraphrasing of upstream content that should be fetched instead.
- [ ] If it overlaps an existing skill, the description says how they differ.
