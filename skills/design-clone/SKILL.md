---
name: design-clone
description: Take a reference website, screenshot, or design file and work out how to rebuild its look in the user's own stack - extracting the underlying design system (palette, type scale, spacing rhythm, motion, component patterns) into a reusable design document plus a concrete build plan. Use when someone says "make it look like this site", shares a URL or screenshot as a target, or wants to recreate a design they admire.
---

# Design Clone

"Make it look like this" is a request to extract a **system**, not to duplicate
a page. Copying pixels gives you one screen that looks right and a second screen
that looks nothing like it. Extracting the system gives you every screen.

## Scope boundary — read before starting

You are recreating a **visual system**: proportions, palette relationships, type
rhythm, spacing, motion character, component patterns. Those are craft, and
learning them from good work is how design has always worked.

You are **not** reproducing identity: logos, wordmarks, brand illustration,
photography, custom icon sets, proprietary typefaces, or copy. And you are not
producing something a visitor would mistake for the reference.

If the request is explicitly to pass a site off as another company's, say plainly
that you will do the system extraction but not the impersonation, then do the
system extraction. That is one sentence, not a lecture. Continue with the work.

## Procedure

### 1. Check the catalog before analysing anything

If the reference is a known product, someone may have already done a careful
analysis - which will be better than what you extract from one screenshot.

```bash
curl -s "https://api.github.com/repos/VoltAgent/awesome-design-md/git/trees/main?recursive=1" \
  | grep -o 'design-md/[^/]*/DESIGN.md'
```

74 brands were indexed at last check, including Linear, Stripe, Vercel, Notion,
Figma, Apple, Spotify, Raycast and Supabase. If the reference is there:

```bash
curl -s "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<slug>/DESIGN.md"
```

Read it in full, skip to step 4, and credit VoltAgent in your handoff.

### 2. Gather evidence

**From a live URL** — get the computed truth, not your impression of it.
Open the page and extract real values:

```js
// Run in the page. Reports what is actually used, ranked by frequency.
const tally = (fn) => {
  const counts = new Map();
  for (const el of document.querySelectorAll('body *')) {
    if (!el.offsetParent && el.tagName !== 'BODY') continue;
    const v = fn(getComputedStyle(el), el);
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 14);
};
JSON.stringify({
  bg:      tally((s) => s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor),
  color:   tally((s) => s.color),
  font:    tally((s) => s.fontFamily.split(',')[0].replace(/["']/g, '')),
  size:    tally((s) => s.fontSize),
  weight:  tally((s) => s.fontWeight),
  radius:  tally((s) => s.borderRadius !== '0px' && s.borderRadius),
  shadow:  tally((s) => s.boxShadow !== 'none' && s.boxShadow),
  border:  tally((s) => s.borderTopWidth !== '0px' && `${s.borderTopWidth} ${s.borderTopColor}`),
  spacing: tally((s) => s.paddingTop !== '0px' && s.paddingTop),
  ease:    tally((s) => s.transitionTimingFunction !== 'all' && s.transitionDuration !== '0s' && `${s.transitionDuration} ${s.transitionTimingFunction}`),
}, null, 1);
```

Also capture the page at 1440px and 390px wide. How a design collapses on mobile
tells you which parts of it are load-bearing.

**From a screenshot** — you cannot measure, so measure relatively. Read off:
the number of distinct text sizes, the ratio between the largest and body text,
whether separation comes from borders / shadows / background shifts / pure
spacing, the corner radius relative to element height, and how much of the frame
is empty.

### 3. Separate system from decoration

This is the step that determines whether the result is reusable.

**System** (extract, keep): the type scale ratio; the spacing unit and its
multiples; how many greys exist and how they are used; whether accent color is
rare or everywhere; how surfaces are separated; the motion character; the
grid and maximum content width.

**Decoration** (note, do not port): specific illustrations, hero imagery,
one-off gradients, the marketing copy, the logo.

**Structure** (a build-plan input, not a style input): section order, the
navigation pattern, where the primary action sits.

Watch for the difference between what the reference *does* and what makes it
*good*. A site may use a 1.333 type ratio; what makes it work is that it only
uses four steps of it. Ratios are easy to copy, restraint is the actual skill.

### 4. Normalise into a design document

Round measured values to a system. Real sites accumulate drift - `13px`, `13.6px`
and `14px` all appear because three people shipped three components. Collapse
them. If you measured `15.8px`, `16px` and `16.5px`, the system is `16px`.

Write `DESIGN.md` at the project root using the structure in the `style-scout`
skill, with two additions:

```markdown
## Provenance
Extracted from <reference> on <date>. This describes the visual system only.
Identity assets - logo, wordmark, photography, custom icons - are not included
and must be replaced with the project's own.

## Deliberate divergences
- <what you changed, and why>
```

The divergences section matters. A pure copy will look wrong the moment content
differs from the reference's content, and it will. Note where you adapted.

### 5. Map onto real components

Do not hand-build what already exists:

```bash
node scripts/search.mjs --capability components --stack <stack> --json
curl -s https://ui.shadcn.com/r/index.json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).map(x=>x.name).join(' ')))"
```

For each distinct component in the reference, decide: existing component themed
to match, existing component modified, or genuinely custom. Most references
decompose into a themed standard set plus two or three custom pieces. Finding
those two or three is the real work.

### 6. Build plan

Deliver, in this order:

1. `DESIGN.md` — the extracted system.
2. **Token file** — in the project's actual format (CSS custom properties,
   Tailwind theme, whatever the project uses).
3. **Component mapping** — reference element → catalog component → what changes.
4. **Build order** — tokens, then layout shell, then components, then motion.
   Motion last: animating a layout you are still changing wastes the effort.
5. **Gaps** — what you could not extract and had to decide yourself.

### 7. Verify

Build one screen, screenshot it beside the reference at the same width, and
compare specifically: type hierarchy, spacing rhythm, weight of separation,
color temperature. "Looks about right" is not a check. Name what differs and
fix the system, not the screen - a fix applied to one screen is a fix you will
apply again on every future screen.

## Failure modes

- **Copying computed values verbatim.** Real CSS is full of drift. Normalise.
- **Skipping the mobile capture.** Half the design decisions only become visible
  when the layout has to collapse.
- **Cloning the marketing page for an application.** Landing pages optimise for
  a first impression; app chrome optimises for the thousandth visit. Extract the
  foundations, then re-derive density and hierarchy for the actual surface.
- **Stopping at the screenshot.** A static match that has no rule for the states
  the reference did not show - loading, empty, error, long text - is not done.

## Credits

- **[Awesome DESIGN.md](https://github.com/voltagent/awesome-design-md)** by
  [VoltAgent](https://github.com/VoltAgent) (MIT) — pre-analysed brand design languages;
  always check here before extracting by hand.
- **[shadcn/ui](https://github.com/shadcn-ui/ui)** by [shadcn-ui](https://github.com/shadcn-ui) (MIT) —
  component registry and color scales for the implementation layer.
- **[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** by
  [nextlevelbuilder](https://github.com/nextlevelbuilder) (MIT) — style taxonomy for naming what you extracted.
- **[Skills For Designers and Engineers](https://github.com/emilkowalski/skills)** by
  [Emil Kowalski](https://github.com/emilkowalski) (MIT) — read `animation-vocabulary` before
  describing the reference's motion, and `animate` before reproducing it.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
