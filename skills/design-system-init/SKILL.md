---
name: design-system-init
description: Bootstrap a real design system into a codebase - design tokens in the project's native format, a themed component layer, dark mode, and a DESIGN.md the rest of the work reads from. Use when a project has UI but no system, when styling has drifted across files, or when starting a new project that will grow past a handful of screens.
---

# Design System Init

A design system is three things that must agree: **tokens** (the values),
**components** (the values applied), and a **written document** (why those
values). Ship one without the others and it decays within weeks.

## When to use

- New project that will outlive a prototype.
- Existing project where the same blue appears as four different hex values.
- Before a redesign - you cannot systematically change what was never a system.

## When not to use

- A throwaway prototype or a single landing page.
- A project already on a mature system. Extend it; do not install a second one.

## Procedure

### 1. Survey what exists

Never start from zero in a codebase that already has opinions:

```bash
# the true palette, ranked - usually reveals the drift
grep -rhoE '#[0-9a-fA-F]{3,8}\b' --include="*.css" --include="*.ts*" --include="*.jsx" . \
  | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn | head -30

# spacing and radius vocabulary in use
grep -rhoE '\b(margin|padding|gap)[a-z-]*:\s*[0-9.]+(px|rem)' --include="*.css" . | sort | uniq -c | sort -rn | head -20

# what the project already depends on
cat package.json 2>/dev/null | grep -E 'tailwind|@mui|antd|styled-|emotion|chakra|panda'
ls tailwind.config.* app/globals.css src/index.css 2>/dev/null
```

Report the drift count before proposing anything. "You have 34 distinct greys"
is the argument for doing this work, and it is more persuasive than any advocacy.

### 2. Settle the direction

Run `style-scout` if there is no `DESIGN.md`. Tokens without a direction are
arbitrary numbers, and arbitrary numbers get overridden the first time someone
disagrees.

### 3. Define tokens in two layers

The layering is what makes a system themeable instead of merely centralised.

**Primitives** — raw values, no meaning attached:

```css
--gray-50: #fafafa;  --gray-500: #71717a;  --gray-950: #09090b;
--indigo-500: #6366f1;
--size-1: 4px; --size-2: 8px; --size-3: 12px; --size-4: 16px; --size-6: 24px;
```

**Semantic** — meaning, pointing at primitives. This is the layer components use:

```css
:root {
  --color-bg: var(--gray-50);
  --color-surface: #ffffff;
  --color-border: var(--gray-200);
  --color-text: var(--gray-950);
  --color-text-muted: var(--gray-500);
  --color-accent: var(--indigo-500);
  --color-accent-fg: #ffffff;
  --color-danger: var(--red-600);
}
:root[data-theme="dark"], :root:not([data-theme="light"]) {
  /* Only the semantic layer flips. Primitives never change. */
}
```

Dark mode is the test of whether the layering is real. If a component references
`--gray-200` directly, it will be wrong in dark mode. Components may only touch
semantic tokens.

Do not invent color scales. Pull ones that already work in both themes:

```bash
curl -s https://ui.shadcn.com/r/colors/index.json
```

Cover, at minimum: color, spacing (one unit, ~6 steps), type scale (~6 steps),
font weights (2-3 maximum), radius (3 steps), border widths, shadows (3 steps),
z-index layers, motion durations and easings.

### 4. Emit in the project's native format

Tokens the framework does not understand get bypassed. Match the project:

- **Tailwind** — the theme config / `@theme` block, so utilities generate from tokens.
- **CSS-in-JS** — the library's theme object.
- **Material UI** — `createTheme`. See `https://mui.com/material-ui/llms.txt`.
- **Ant Design** — its token-based theme API.
- **Plain CSS** — custom properties on `:root`.

Then wire the component layer to consume them. In a shadcn/ui project that means
its CSS variable contract; in MUI or Ant Design it means the theme provider, not
per-component `sx` overrides.

### 5. Write `DESIGN.md`

Same structure as `style-scout`, plus the token file path and the rule that
components use semantic tokens only. Without the document, the next person adds
a hard-coded hex and nobody can point at why that is wrong.

### 6. Prove it, then migrate

Convert **one** real component end to end. Confirm both themes, all its states,
and a 390px viewport. A system that has never survived a real component is a
hypothesis.

Then migrate by frequency, not by folder - the most-used components first, so
value lands early and the pattern is visible before the tedious part.

Consider Storybook at this point (`npx storybook@latest init`). A design system
whose states are not visible somewhere is one nobody can review.

### 7. Guard it

Whatever the project can enforce, enforce:

- A lint rule against raw hex values outside the primitives file.
- Visual regression tests via Storybook.
- One CI check that fails on a hard-coded color.

An unenforced system reverts to drift. That is not pessimism, it is the observed
default.

## Failure modes

- **One flat token layer.** Themeable systems need primitives and semantics.
- **Too many tokens.** Forty spacing steps is not a system, it is arbitrary values
  with longer names. Six steps that people actually use beats forty that they do not.
- **Tokens in a format the framework ignores.** They will be bypassed silently.
- **Big-bang migration.** Prove on one component first.
- **Skipping the document.** Then the system is folklore.

## Credits

- **[shadcn/ui](https://github.com/shadcn-ui/ui)** by [shadcn-ui](https://github.com/shadcn-ui) (MIT) —
  color scales and a CSS-variable theming contract worth copying wholesale.
- **[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** by
  [nextlevelbuilder](https://github.com/nextlevelbuilder) (MIT) — its `design-system` skill covers
  primitive / semantic / component token architecture in depth; read it before designing your own layering.
- **[Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md)** by
  [VoltAgent](https://github.com/VoltAgent) (MIT) — real brand token sets as reference points.
- **[Material UI](https://github.com/mui/material-ui)** by [MUI](https://github.com/mui) (MIT) —
  `createTheme` is the supported customization surface.
- **[Ant Design](https://github.com/ant-design/ant-design)** by [Ant Design](https://github.com/ant-design) (MIT) —
  a mature design-token API worth studying.
- **[Storybook](https://github.com/storybookjs/storybook)** by [Storybook](https://github.com/storybookjs) (MIT) —
  documentation and visual regression for the system.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
