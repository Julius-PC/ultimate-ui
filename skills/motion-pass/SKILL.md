---
name: motion-pass
description: Add, fix, or remove animation in an interface - choosing curve, duration, and animated properties deliberately, and deciding what should not move at all. Use when asked to make something feel smoother or more polished, when adding transitions, or when existing motion feels sluggish, jarring, or cheap.
---

# Motion Pass

Motion is the fastest way to make an interface feel considered, and the fastest
way to make it feel cheap. The difference is a small number of specific choices,
and agents get them wrong in consistent, predictable ways.

**Read the upstream skills first.** Emil Kowalski's `animate`,
`review-animations` and `animation-vocabulary` encode exactly these mistakes and
how to avoid them. They are the reference; this skill is the routing around them.

```bash
curl -s https://raw.githubusercontent.com/emilkowalski/skills/main/skills/animate/SKILL.md
curl -s https://raw.githubusercontent.com/emilkowalski/skills/main/skills/animation-vocabulary/SKILL.md
curl -s https://raw.githubusercontent.com/emilkowalski/skills/main/skills/review-animations/SKILL.md
# React Native / Expo:
curl -s https://raw.githubusercontent.com/emilkowalski/skills/main/skills/animate-expo/SKILL.md
```

Read them in full. The value is in the specific rules, which is exactly what a
summary destroys.

## Procedure

### 1. Decide whether it should move at all

The strongest motion decision is usually restraint. Animate when it:

- **explains a spatial relationship** — a panel comes from where it belongs,
- **preserves continuity** — an element persists rather than being replaced,
- **acknowledges input** — press feedback within ~100ms,
- **directs attention once** — a thing that genuinely just changed.

Do not animate: anything on a hot path the user hits dozens of times a session;
content that should just be there on load; decoration that competes with reading.

`find-animation-opportunities` in the upstream set covers this both ways -
including what not to animate, which is the half usually skipped.

### 2. Pick the curve for the direction

The single most common mistake, and the easiest to fix:

| Motion | Easing | Why |
| --- | --- | --- |
| Enter, appear, expand | `ease-out` | Fast then settling. Arrives, does not creep. |
| Exit, dismiss, collapse | `ease-in` | Accelerates away. Does not linger. |
| Move between two on-screen states | `ease-in-out` | Symmetric. |
| Anything the user drags or flings | spring | Physical, interruptible. |

`ease-in` on an enter is the tell that nobody chose. Linear is for continuous
loops - spinners, progress - and nothing else.

### 3. Duration by distance and frequency

| Case | Range |
| --- | --- |
| Hover, press, focus ring | 80–150ms |
| Small local change (tooltip, toggle, checkbox) | 120–200ms |
| Panel, dropdown, popover | 180–250ms |
| Full-screen or modal transition | 250–350ms |
| Decorative, once per session | up to 500ms |

Two rules that make durations feel right: exits run shorter than enters (~⅔), and
the more often an interaction happens, the shorter it must be. Anything past
~300ms on a frequent action reads as lag no matter how nice the curve is.

### 4. Animate only cheap properties

`transform` and `opacity` are compositor-driven. Nearly everything else triggers
layout or paint on every frame.

```css
/* janky - layout on every frame */
.panel { transition: height 200ms, top 200ms, width 200ms; }

/* smooth */
.panel { transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out; }
```

For height specifically: use a grid `1fr`/`0fr` transition, CSS
`interpolate-size`, or measure and animate `transform: scaleY()` with a
counter-scaled child. Not raw `height`.

Add `will-change` only to something about to animate, and remove it after -
leaving it on permanently costs memory and can make things worse.

### 5. Respect reduced motion

Non-negotiable. For some people this is a vestibular health issue, not a preference.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Prefer a considered fallback where it matters - a cross-fade instead of a slide -
over a blanket kill. The state change still needs to be perceivable.

### 6. Verify honestly

- Watch it at 4x slowdown (DevTools → Rendering) to see the curve.
- Trigger it ten times in a row. Motion that charms once and irritates by the
  tenth repetition is too long or should not exist.
- Check on a mid-range device, not only a fast laptop.
- Interrupt it mid-flight. It should reverse smoothly, not snap or queue.
- Confirm the reduced-motion path.

## Failure modes

- **Easing that ignores direction.** Enter and exit are not the same motion.
- **Uniform durations.** One `200ms` everywhere means no decision was made.
- **Animating layout properties.** Looks fine on a fast machine, janky everywhere else.
- **Motion on hot paths.** The thousandth time is the one that counts.
- **Staggering long lists.** Charming at five items, unbearable at fifty.
- **Skipping reduced motion.** An accessibility failure, not a nicety.

## Credits

- **[Skills For Designers and Engineers](https://github.com/emilkowalski/skills)** by
  [Emil Kowalski](https://github.com/emilkowalski) (MIT) — the substance of this area:
  `animate`, `animate-expo`, `review-animations`, `improve-animations`,
  `find-animation-opportunities`, `animation-vocabulary`, `apple-design`.
  Read them; this skill exists to route you there and stay consistent with them.
  Install permanently with `npx skills@latest add emilkowalski/skills`.
- **[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** by
  [nextlevelbuilder](https://github.com/nextlevelbuilder) (MIT) — its `motion.csv` dataset.
- **[Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers)** by
  [Brad Traversy](https://github.com/bradtraversy) (MIT) — CSS animation and JS animation library sections.
- **[Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md)** by
  [VoltAgent](https://github.com/VoltAgent) (MIT) — brand documents specify motion character; match it.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
