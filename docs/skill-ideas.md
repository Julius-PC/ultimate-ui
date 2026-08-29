# Skill backlog

Eight skills ship today. These are the ones that look worth building next,
roughly ordered by how much they would earn their keep. Each is a real proposal,
not a placeholder — pick one up and open a pull request.

See [`writing-a-skill.md`](writing-a-skill.md) for the how.

## High value, clear shape

### `screenshot-to-ui`
Turn a screenshot, whiteboard photo, or Figma export into working components in
the project's stack. Distinct from `design-clone`, which extracts a *system* from
a reference; this one implements a *specific screen*. Would need: region
decomposition, mapping each region to a catalog component, and an honest report
of what it could not identify. The failure mode to design against is confident
hallucination of components that are not really in the image.

### `visual-qa`
Screenshot the built UI at several viewports and themes, then compare against
`DESIGN.md` and the intended mockup. Reports diffs as findings, not images.
Closes the loop that `ui-review` opens — that skill reads code, this one looks at
pixels. Natural pairing with Storybook's visual regression tooling.

### `a11y-audit`
Split the accessibility half of `ui-review` into a dedicated, deeper skill:
full keyboard traversal, focus order, contrast computed from actual rendered
values rather than tokens, ARIA correctness, screen reader label checks, and
WCAG level mapping. Worth separating because accessibility reviews get skipped
when bundled with taste feedback, and because the output should be a compliance
artefact.

### `responsive-pass`
Take a desktop-first implementation and make it genuinely work down to 320px —
not by adding breakpoints until nothing overlaps, but by deciding what each
layout *becomes* at each size. Covers container queries, fluid type, touch target
sizing, and the navigation pattern change that most designs need and few make.

### `empty-and-error-states`
Sweep a codebase for every list, table, form, and async surface, then generate
the empty, loading, error, and partial states each is missing. This is the single
most consistently skipped category of UI work, and it is highly mechanical to
find — which makes it a good fit for a skill.

## Worth building, needs design work

### `theme-generator`
One brand color plus a mood in, a full accessible palette out — semantic tokens,
light and dark, contrast-verified at every pairing, emitted in the project's
native format. The hard part is that naive palette generation produces scales
that fail contrast in dark mode; the skill is only worth building if it verifies
rather than generates and hopes.

### `design-diff`
Given two commits or two branches, report what changed *visually* rather than
textually. "This PR changes the border treatment on every card" is a review
comment no diff tool produces today.

### `content-fit`
Stress a UI with realistic content: very long names, empty strings, 200-item
lists, RTL text, German compound nouns, emoji in usernames. Reports what breaks.
Pairs with `mockup-studio`, which asks for lumpy content but cannot enforce it.

### `component-extract`
Find repeated markup across a codebase and propose the component it wants to
become, with the right props and variants. The judgement call — when duplication
is genuinely fine — is what makes this hard and what makes it valuable.

### `design-system-migrate`
Move a project from one component library to another, or off a hand-rolled set
onto a catalog one. Component-by-component mapping, an ordered plan, and honest
flagging of what has no equivalent.

## Speculative

### `brand-kit`
Logo, favicon, social cards, email header, presentation template — the assets
around a product that always get made last and badly. Would lean on the brand
skills already in the catalog and on generated imagery.

### `interaction-spec`
Write the specification a complex interaction needs *before* implementing it:
every state, every transition between them, keyboard map, focus behaviour, error
paths. Turns "build a multi-step form" from a guess into a plan.

### `perf-pass`
The rendering-performance half of UI work: layout thrash, oversized images,
render-blocking fonts, unnecessary re-renders, Core Web Vitals. Adjacent to motion
but distinct — `motion-pass` covers whether an animation is *right*, this covers
whether the page is *fast*.

### `ui-copy`
Interface copy as a first-class concern: button labels, empty state text, error
messages, confirmation dialogs. Bad microcopy undermines good design more
reliably than bad spacing does.

### `catalog-gap-finder`
A maintenance skill: analyse what recent work needed and could not find in the
catalog, then propose sources to index. Turns catalog growth from something
someone remembers to do into something the repository notices it needs.
