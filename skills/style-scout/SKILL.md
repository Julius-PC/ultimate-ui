---
name: style-scout
description: Turn a loose description of a desired look ("clean and technical", "like Linear but warmer", "premium, dark, not corporate") into a concrete, written style brief plus the specific catalog sources, brand design languages, component libraries and guides that fit it. Use at the start of any UI work, before writing components, whenever the aesthetic direction is not already settled and documented.
---

# Style Scout

Most bad generated UI is not a coding failure. It is a decision that never got
made: nobody said what the thing should look like, so every screen re-decides
and none of them agree.

This skill makes that decision once, writes it down, and points at the sources
that already solved the problem.

## When to use

- The user described a vibe, a feeling, or a competitor, and you are about to build.
- A project has more than one screen and no `DESIGN.md`.
- Output across a session has started drifting - three screens, three type scales.

## When not to use

- The repo already has a `DESIGN.md` or a token file. Read it and follow it.
  Re-deciding the style is not your call.
- The user asked for one isolated component in an existing system.

## Procedure

### 1. Pin down the brief

Ask at most **three** questions, and only ones whose answers change the output.
If the user gave you enough, skip straight to step 2 - interrogating someone who
already told you what they want is its own failure mode.

The four axes that actually matter:

| Axis | Options |
| --- | --- |
| **Surface** | marketing page / application chrome / dashboard / mobile / docs |
| **Temperature** | warm, human / neutral / cold, technical |
| **Density** | airy and editorial / balanced / dense and operator-focused |
| **Reference** | a named product or brand, or none |

A named reference is worth more than the other three combined. Push for one:
"is there a product whose interface you'd be happy to be compared to?"

### 2. Resolve the brief to catalog terms

Map the answers onto the controlled vocabulary:

```bash
node scripts/search.mjs --list
```

Then query. Filters combine with AND, so start narrow and loosen:

```bash
node scripts/search.mjs --style dark-first --style minimal --stack react --json
node scripts/search.mjs --capability design-language --json
```

Take the union of two or three queries rather than one over-constrained query
that returns nothing.

### 3. Pull a real design language, do not invent one

If a brand was named, or the brief lands near one, fetch its actual design
document instead of improvising a palette:

```bash
# authoritative list of available brand slugs
curl -s "https://api.github.com/repos/VoltAgent/awesome-design-md/git/trees/main?recursive=1" \
  | grep -o 'design-md/[^/]*/DESIGN.md'

# the document itself
curl -s "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md"
```

Read the whole document. The value is in its specifics - the exact scale, the
exact easing, the rule about when a border is allowed - and those are precisely
what gets lost in a summary.

If no brand fits, get a named style from the style taxonomy rather than making
one up:

```bash
curl -s "https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/cli/assets/data/styles.csv"
```

### 4. Choose the implementation layer

Match the resolved style to something buildable:

```bash
node scripts/search.mjs --capability components --stack <their-stack> --json
```

Read each candidate's `avoid_when` before recommending it. A source that is
wrong for the project is worse than no recommendation, and `avoid_when` is where
that is written down.

Recommend **one** primary library and say why in a sentence. A list of five
options hands the decision back to the user, which is the thing they asked you
to take off their plate.

### 5. Write `DESIGN.md`

Write it to the project root. The format is a plain markdown design document -
the convention the catalog's design-language sources use, and the one coding
agents read most reliably.

```markdown
# DESIGN.md

## Direction
One paragraph. What this should feel like, and what it should never feel like.
The negative half is what stops drift.

## Foundations
- **Palette** — every value, named. Background, surface, border, text primary,
  text muted, accent, destructive. Light and dark.
- **Type** — family, weights actually used, the scale as concrete values.
- **Spacing** — the base unit and the permitted steps.
- **Radius, borders, elevation** — the rule, not a range.

## Motion
Default duration and easing. What animates, and what must not.

## Components
Per component: the decisions that are already made. Button height, input border
treatment, card padding, empty-state shape.

## Rules
Hard constraints. "No pure black." "Never more than two font weights on a
screen." "Accent color is for a single primary action per view."

## Sources
Where this came from - repo, author, license. See the Credits section of this skill.
```

Every value must be concrete. `--space-4: 16px` is a decision. "generous
spacing" is a wish, and the next agent will interpret it differently than you did.

### 6. Hand off

Report: the resolved direction in one sentence, the primary library and why,
the path to `DESIGN.md`, and the sources you drew from with their authors.

Then tell the user to point future work at `DESIGN.md` rather than re-describing
the style each time. That is the whole point of writing it down.

## Failure modes

- **Averaging references.** Two brands blended give you neither. Pick one as the
  spine and borrow at most one specific element from the other.
- **Copying an identity.** Take the system - scale, rhythm, restraint. Leave the
  logo, wordmark, and trade dress. See `docs/attribution-policy.md`.
- **A brief with no negatives.** "Clean and modern" describes almost every
  interface ever shipped. If the direction does not rule anything out, it is not
  a direction yet.

## Credits

This skill routes to work by others. Credit them when you use their output:

- **[Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md)** by
  [VoltAgent](https://github.com/VoltAgent) (MIT) — the brand design-language documents.
- **[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** by
  [nextlevelbuilder](https://github.com/nextlevelbuilder) (MIT) — the style taxonomy and per-stack catalogs.
- **[shadcn/ui](https://github.com/shadcn-ui/ui)** by [shadcn-ui](https://github.com/shadcn-ui) (MIT) — component and color registries.
- **[Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers)** by
  [Brad Traversy](https://github.com/bradtraversy) (MIT) — fonts, color tools, inspiration.

Full attribution for every indexed source: [`CREDITS.md`](../../CREDITS.md).
