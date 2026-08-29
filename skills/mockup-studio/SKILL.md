---
name: mockup-studio
description: Generate several genuinely different visual directions for a screen or flow as self-contained HTML mockups the user can click through and compare side by side, before any real code is written. Use when someone asks for a mockup, wireframe, or "show me some options", when a direction has not been chosen yet, or when a description is ambiguous enough that showing beats discussing.
---

# Mockup Studio

The purpose of a mockup is to make a decision cheap. One mockup is a proposal
and invites nitpicking; three real alternatives are a decision and invite a
choice. Always produce more than one.

## When to use

- The user asked for a mockup, wireframe, or options.
- You are about to build something substantial from an ambiguous description.
- Two plausible readings of the request would produce different screens.

## When not to use

- The direction is settled and `DESIGN.md` exists. Build the real thing.
- The change is to an existing screen. Modify it; do not mock it up separately.

## Procedure

### 1. Get a design language first

Mockups without a design language are three arbitrary guesses. Run `style-scout`
first, or read the existing `DESIGN.md`. All variants then share tokens, and the
differences between them are *deliberate* rather than accidental.

### 2. Choose axes that actually differ

Three variants that differ only in accent color are one variant. Vary something
structural. Pick two or three from:

| Axis | Variant A | Variant B |
| --- | --- | --- |
| **Density** | airy, one idea per screenful | compact, everything visible |
| **Hierarchy** | one dominant element | balanced peers |
| **Navigation** | sidebar | top bar / command-driven |
| **Separation** | borders and rules | elevation and surface shifts |
| **Entry point** | content first | action first |
| **Tone** | restrained | expressive |

Name each variant for its idea - `focus`, `dashboard`, `command` - not `option-1`.
The name is what the user will argue with, which is exactly what you want.

### 3. Build them as self-contained HTML

One file per variant. No build step, no dependencies, no network - a mockup that
needs `npm install` is not a mockup.

**Non-negotiables, or the comparison is invalid:**

- **Identical tokens across variants.** Same `:root` block in each file. If
  variants have different palettes you are comparing palettes, not layouts.
- **Real content.** Actual product nouns, plausible names, realistic string
  lengths. Lorem ipsum hides every hierarchy problem you are trying to surface.
- **The unhappy states.** At least one variant must show empty, loading, error,
  and an overlong string. These are where designs break, and where a mockup that
  only shows the happy path is actively misleading.
- **Both themes**, if the project has both. `prefers-color-scheme` plus an
  explicit toggle.
- **Responsive.** Check 390px. A desktop-only mockup defers the hard half.

Skeleton:

```html
<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Variant: focus</title>
<style>
  /* Shared token block - byte-identical in every variant file. */
  :root {
    --bg: #ffffff; --surface: #f7f7f8; --border: #e4e4e7;
    --text: #18181b; --muted: #71717a; --accent: #4f46e5;
    --radius: 8px; --unit: 4px;
    --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #09090b; --surface: #18181b; --border: #27272a;
      --text: #fafafa; --muted: #a1a1aa; --accent: #818cf8;
    }
  }
  :root[data-theme="dark"] { /* same dark values, so the toggle wins both ways */ }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font); }
</style>
<!-- Variant-specific layout below. Tokens above never change between variants. -->
```

Write real markup. A greyed-out wireframe answers no question worth asking - it
cannot show whether the hierarchy works, whether the copy fits, or whether the
type scale holds up.

### 4. Wrap in a switcher

One `index.html` that loads variants in an iframe with buttons to swap, plus a
width control for 390 / 768 / 1440. Comparison requires switching without losing
scroll position and context; opening three files in three tabs does not achieve
that.

### 5. Present

For each variant, two lines: what it optimises for, and what it gives up. The
tradeoff is the useful half - a variant with no downside has not been thought
about.

State your recommendation and why. Then let the user pick, including picking a
combination ("B's navigation with A's density"), which is the most common and
usually the best outcome.

### 6. Imagery

If a mockup needs real imagery rather than placeholder blocks:

- Photography, icons, illustration sources — see the curated list in
  `design-resources-for-developers` (`node scripts/search.mjs --capability asset-sourcing`).
- Generated imagery — ComfyUI, if the user has an instance running. Check
  `avoid_when` on that entry first: it needs a GPU, and generated assets carry
  model-specific licensing that matters if this ships.

Placeholder blocks are fine and often better. Imagery hides layout problems, and
a mockup exists to expose them.

## Failure modes

- **Variants that are one variant.** If you can describe the difference as
  "different colors", start over.
- **Perfect content.** Every name six characters, every list exactly four items.
  Real data is lumpy; make the mockup lumpy.
- **Silent single variant.** If you genuinely believe only one direction is
  viable, say so and explain why, rather than padding with two you would not ship.
- **Mockups that become production code.** They are single-file throwaways with
  no state management. Say so at handoff.

## Credits

- **[shadcn/ui](https://github.com/shadcn-ui/ui)** by [shadcn-ui](https://github.com/shadcn-ui) (MIT) —
  color scales at `https://ui.shadcn.com/r/colors/index.json` beat inventing hex values.
- **[Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md)** by
  [VoltAgent](https://github.com/VoltAgent) (MIT) — a design language to base variants on.
- **[Skills For Designers and Engineers](https://github.com/emilkowalski/skills)** by
  [Emil Kowalski](https://github.com/emilkowalski) (MIT) — the `prototype` skill covers
  multi-version exploration with a switcher; read it before building your own.
- **[Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers)** by
  [Brad Traversy](https://github.com/bradtraversy) (MIT) — fonts, photos, mockup templates.
- **[ComfyUI](https://github.com/Comfy-Org/ComfyUI)** by [Comfy Org](https://github.com/Comfy-Org) (GPL-3.0) —
  generated imagery when placeholders will not do.
- **[Storybook](https://github.com/storybookjs/storybook)** by [Storybook](https://github.com/storybookjs) (MIT) —
  where variants go once one is chosen and becomes real components.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
