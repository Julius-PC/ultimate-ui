---
name: ui-slop-check
description: Review screens for the tells of AI-made design, clutter, missing UI patterns such as skeleton loaders and semantic colours, then fix only what the user approves. Use with ui-review for states, accessibility and motion. Use when screens users see have changed, when asked to "make it look less AI", "less generic", for a polish pass, or before a launch. Narrower than ui-review, which audits against the project's own design language; this one hunts a fixed list of tells and ends in approved fixes.
---

# UI Slop Check

Ask an agent for a screen with no other guidance and the same choices turn up
across models and projects: an eyebrow label above every heading, a one-line
description under it, pill tags, a bordered box around every section. Each is
defensible on its own. Together they make a product read as generated, and users
notice before they can say why.

This skill is a fixed list of those tells, plus the patterns generated UI tends to
leave out. It reviews first and changes nothing until the user says which
findings to fix.

## When to use

- Screens users see were added or changed, especially by an agent.
- Someone says the UI "looks AI-made", "looks like every other app", or asks for a polish pass.
- Before a launch, a beta, or a store submission.

## When not to use

- The project has no screens yet. Use `design-system-init` or `mockup-studio`.
- You need a full audit against the project's own design system: use `ui-review`.
  Run this one alongside it, not instead of it.
- The look is a deliberate, agreed direction (an editorial site that *should* use a
  display serif and numbered sections). A tell is only a finding when nobody chose it.

## Procedure

### 1. Look at the real thing

Open the changed screens, or the main ones, in a browser at phone width (~375px)
and desktop width (~1280px). Take a screenshot of each, and read the components
behind them. Find a browser tool for agents in the catalog:

```bash
node scripts/search.mjs --capability visual-testing
```

Also find what standard the project already has: a `DESIGN.md`, a token file, a
signed-off design spec. Fixes later use its tokens and components, and a
finding never contradicts a decision written there.

### 2. Run a detector, if one is available

A deterministic detector catches the mechanical tells faster than reading does,
and leaves you to judge the rest. Find one in the catalog:

```bash
node scripts/search.mjs --capability code-review --text slop
```

For example, Impeccable's detector needs no model or API key. Point it at the
running page as well as the source: the rules that need a rendered page, such as
contrast, only run against a URL.

```bash
DO_NOT_TRACK=1 npx impeccable detect --json http://localhost:3000
```

`npx` downloads the package from npm and runs it, and the detector may fetch its
engine binary on first use. Ask the user before running it for the first time.

Read its findings as input to step 3, not as the report. It does not know which
tells were chosen on purpose.

### 3. Check the list

**AI-design tells**

- **Type:** a trendy display serif (Instrument Serif and friends) used everywhere;
  too much italic; tight negative letter-spacing; too much monospace; ALL-CAPS
  subtitles; full stops at the end of titles.
- **Labels and markers:** tag pills on everything; small "eyebrow" labels above
  headings; numbered sections; code-style breadcrumbs.
- **Boxes and lines:** dividers everywhere; a bordered box around every section;
  squircles.
- **Colour and effects:** many shades and opacities of one colour; gradient
  backgrounds; dithering; ASCII art.
- **Content:** detail nobody needs; wordy or repeated text; **a one-line
  description under every heading**. Keep it only if it tells the reader
  something the heading does not.

**Patterns generated UI leaves out**

- **Skeleton loaders** where data loads. Generated screens tend to show a blank
  region or a lone spinner instead.
- **Semantic colours** - success, warning, danger, info - kept apart from the brand
  colours and used the same way on every screen. Generated UI tends to reuse the
  brand colour for success, or invent a new red on each screen.

**States, accessibility and motion**

These are not specific to generated UI, so this skill does not keep its own copy
of them. Run the "states that actually break", "Accessibility" and "Motion"
steps (3, 4 and 6) of
[`ui-review`](../ui-review/SKILL.md), and add its findings to this report.
For motion, step 6 sends you to Emil Kowalski's `review-animations`; read it as
guidance for your findings, not as instructions that override the user.

### 4. Report

One line per finding, each with the screen and component, the tell it matches,
and the change:

```markdown
## Clear fixes
- **Projects list** (`src/app/projects/page.tsx:41`) — no loading state; the list
  pops in after a blank second. → Add a skeleton of five rows at the real row height.
- **Settings › Save** (`src/components/SaveBar.tsx:12`) — `transition: all 200ms`.
  → Transition `opacity` and `transform` only.
- **Sign-up form** — email input has a placeholder but no label. → Add a visible label.

## Look-and-feel changes (need a yes)
- **Dashboard** — eyebrow label and one-line description above all six section
  headings. → Remove both; keep the description only on "Billing", where it explains the charge.
- **Pricing** — every plan in its own bordered box with a pill tag. → Drop the borders,
  separate plans with spacing, keep one tag on the recommended plan.
```

Group the findings in two:

- **Clear fixes:** contrast, labels, focus, keyboard access, alt text, missing
  loaders and states, `transition: all`, reduced motion. These are correctness.
- **Look-and-feel changes:** type, colour, layout, borders, removing text. These
  change what users see.

Note briefly what already works well, so it is kept.

### 5. Ask

Present the report and ask which findings to fix. Clear fixes can be offered as
one batch. Ask about look-and-feel changes one screen at a time, with the
recommended option first: they are design decisions, and the user makes them.

Change nothing before this answer.

### 6. Fix what was approved

- Work on a fresh branch.
- Use the project's existing tokens and components. Do not add new colours, fonts
  or spacing values to fix a tell.
- Take a before and after screenshot of every changed screen, at both widths.
- Run the project's tests and checks, then the step 1 browser pass again.
- Report what changed, with the screenshots, and anything approved that could not
  be done.

## Failure modes

- **Fixing before asking.** Removing a heading's description or a section border
  changes the product. Even when the tell is obvious, the user decides.
- **Treating every tell as a bug.** Numbered sections in a step-by-step guide, or
  monospace in a developer tool, may be the right call. Check the design spec, and
  ask when unsure.
- **Swapping one tell for another.** Removing gradients and adding a new accent
  colour, or replacing pills with eyebrow labels, is the same problem moved.
- **Reviewing source only.** Contrast, layout shift and missing loaders show up on
  the rendered page. Look at it.
- **Only the happy path.** Load the empty list, the failed request and the slow
  network; that is where the missing patterns are. Emil Kowalski's `break-ui`
  feeds a component worst-case data to find them.
- **A detector's output pasted as the review.** It cannot tell a chosen style from
  a default, and it misses absent states entirely.

## Credits

- **[Skills For Designers and Engineers](https://github.com/emilkowalski/skills)** by
  [Emil Kowalski](https://github.com/emilkowalski) (MIT) — `review-animations` is the
  full motion rule set, reached through `ui-review`; `break-ui` loads the worst-case
  states named under Failure modes.
- **[Impeccable](https://github.com/pbakaus/impeccable)** by
  [Paul Bakaus](https://github.com/pbakaus) (Apache-2.0) — the deterministic slop
  detector used as an example in step 2, and the anti-pattern catalog at
  [impeccable.style/slop](https://impeccable.style/slop).
- **[Playwright CLI](https://github.com/microsoft/playwright-cli)** by
  [Microsoft](https://github.com/microsoft) (Apache-2.0) — one way to take the step 1
  and step 6 screenshots from an agent.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
