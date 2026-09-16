---
name: ui-review
description: Audit UI that already exists against its own design language, accessibility requirements, responsive behaviour, and the states real products hit - producing a prioritised, fixable list rather than a vague impression. Use when UI technically works but feels off, before shipping a surface, or when asked to review, critique, or check an interface.
---

# UI Review

"Looks fine" and "feels off" are both useless. A review is only worth anything
if every finding names a specific element, the rule it breaks, and the fix.

## Procedure

### 1. Establish the standard first

You cannot review against nothing. In order of preference:

1. The project's `DESIGN.md` or token file.
2. The design language it was cloned from.
3. Internal consistency - the interface's own most-common patterns become the rule,
   and the outliers become the findings.

If none exists, say so, review for internal consistency and accessibility only,
and recommend `design-system-init`. Do not silently substitute your own taste for
a standard the project never agreed to.

### 2. Token adherence

Where the implementation drifted from the system:

```bash
# hard-coded values that should be tokens
grep -rnE '#[0-9a-fA-F]{3,8}\b' --include="*.tsx" --include="*.jsx" --include="*.vue" src app 2>/dev/null | head -40
grep -rnE '\b(padding|margin|gap|font-size)[a-z-]*:\s*[0-9.]+px' --include="*.css" src app 2>/dev/null | head -40
```

Every raw value in a component is a finding. Cite `file:line`.

### 3. The states that actually break

Most reviews check the happy path, which is the one state that was definitely
tested. Check the rest:

| State | The question |
| --- | --- |
| **Empty** | Is there a real empty state, or a blank region? Does it say what to do next? |
| **Loading** | Does layout shift when content arrives? Skeletons should match final dimensions. |
| **Error** | Is the message actionable, or a status code? |
| **Long content** | 60-character names, 200-item lists. Does it wrap, truncate, or overflow? |
| **Short content** | One item. Does the layout collapse absurdly? |
| **Slow network** | Is there feedback within ~100ms of a click? |
| **Dark mode** | Every surface, border and shadow - not just backgrounds. |
| **Zoom to 200%** | Does it stay usable? This is an accessibility requirement, not an edge case. |

### 4. Accessibility

Not optional, and cheap to check:

- **Keyboard only.** Tab through the whole surface. Every interactive element
  reachable, focus always visible, order matches visual order, no traps except
  intentional ones in modals, Escape closes overlays.
- **Contrast.** 4.5:1 body text, 3:1 large text and UI boundaries. Check muted
  text and placeholders specifically - that is where it fails.
- **Semantics.** Real `<button>` for actions, real `<a href>` for navigation.
  A `<div onClick>` is a finding every time.
- **Labels.** Every input has one. Icon-only buttons have accessible names.
- **Reduced motion.** `prefers-reduced-motion` respected.
- **Target size.** ~44px minimum on touch.
- **Images.** Meaningful alt text, or `alt=""` if decorative - deliberately either way.

If the project uses Storybook, its accessibility addon catches a real fraction of
this automatically. Recommend it rather than relying on manual passes forever.

### 5. Craft

Where "feels off" usually lives:

- **Hierarchy.** Squint. Does the most important thing dominate? If everything is
  bold, nothing is.
- **Spacing rhythm.** Off-scale values read as sloppiness even when nobody can
  name why. Related items closer than unrelated ones.
- **Optical alignment.** Mathematically centered icons often look off-center.
- **Type.** More than three sizes or three weights on one screen is usually drift,
  not intent. Line length past ~75 characters hurts reading.
- **Separation.** Borders, shadows and background shifts should not all be used
  for the same job on the same screen. Pick one idiom.
- **Motion.** See below.

### 6. Motion

Read the animation skills in Emil Kowalski's set before writing motion findings -
they encode the specific mistakes agents and people make. The recurring ones:

- `ease-in` on an enter animation. Enters want `ease-out`.
- Durations over ~300ms on frequent interactions. It reads as lag.
- Animating `width`, `height`, `top`, `left` instead of `transform` and `opacity`.
- Motion on something that repeats constantly - charming once, irritating by the tenth time.
- No `prefers-reduced-motion` path.

### 7. Report

Group by severity, and make every finding actionable:

```markdown
## Blocking
- `src/components/Dialog.tsx:34` — Focus is not trapped; Tab escapes to the page
  behind the modal. Keyboard users lose their place.
  **Fix:** use the catalog's dialog primitive, which handles this.

## Should fix
- `src/components/Card.tsx:12` — `padding: 18px` is off the 4px scale.
  **Fix:** `var(--size-4)` (16px) or `var(--size-5)` (20px).

## Consider
- Empty state on the projects list is a bare "No projects." No path forward.
  **Fix:** add a primary action.
```

Order by user impact, not by how easy the fix is. Cap it at around fifteen
findings - a review with sixty items gets skimmed and then ignored, which is
worse than a review with the twelve that mattered.

Note what is genuinely good, briefly and specifically. Not politeness: it tells
the team which patterns to keep, which is information they otherwise lack.

## Failure modes

- **Reviewing against personal taste** while implying it is a standard.
- **Findings without locations.** `file:line` or it is an opinion.
- **Only the happy path.** That is the one state already known to work.
- **Sixty findings.** Prioritise, or be ignored.
- **Restyling instead of reviewing.** The output is a list, not a diff, unless
  fixes were asked for.

## Credits

- **[Skills For Designers and Engineers](https://github.com/emilkowalski/skills)** by
  [Emil Kowalski](https://github.com/emilkowalski) (MIT) — `review-animations`, `improve-animations`
  and `apple-design`. Read the relevant one before writing motion or interaction findings.
  `mobile-native` covers the phone-specific tells - sticky hover, tap delay, safe areas,
  inputs that zoom the page - worth checking whenever the surface is reviewed on a phone.
- **[Storybook](https://github.com/storybookjs/storybook)** by [Storybook](https://github.com/storybookjs) (MIT) —
  state coverage, accessibility addon, visual regression.
- **[Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md)** by
  [VoltAgent](https://github.com/VoltAgent) (MIT) — a reference standard when the project has none.
- **[shadcn/ui](https://github.com/shadcn-ui/ui)** by [shadcn-ui](https://github.com/shadcn-ui) (MIT) —
  accessible primitives to replace hand-rolled components you find.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
