# Attribution policy

Everything indexed here was built by someone else. This repository is an index
and a set of procedures; the substance belongs to the upstream authors.

## What we commit to

1. **Every source names its author.** `author.name` and `author.url` are required
   fields. The validator fails the build without them, so an unattributed entry
   cannot merge.

2. **Original creators are credited even when a repo lives under an org.**
   That is what `author.credit_note` is for. shadcn/ui sits under the `shadcn-ui`
   organization but was created by shadcn; ComfyUI sits under Comfy Org but was
   created by comfyanonymous. Both are recorded.

3. **Licenses are named, not assumed.** Every entry carries the upstream SPDX
   identifier and a link. Where it is genuinely unclear, the entry says
   `NOASSERTION` and explains why in `notes`.

4. **`CREDITS.md` is generated from the catalog.** It cannot drift out of sync
   with the entries, because it is rebuilt from them and CI fails if it is stale.

5. **Skills credit what they route to.** Every `SKILL.md` ends with a Credits
   section naming the sources it depends on, with author and license. A skill
   that quietly relies on someone else's work without saying so is a bug.

6. **We do not vendor.** No upstream components, docs, or markdown are copied
   into this repository. Entries link and describe. This is the licensing posture
   and it is not negotiable - it is also why the catalog stays honest, since a
   link resolves to the current version rather than a snapshot of what we happened
   to copy.

7. **Removal on request, no argument.** If you maintain an indexed project and
   want the entry changed or removed, open an issue. We will act on it.

## What this repository's own license covers

The MIT license in `LICENSE` covers this repository's catalog metadata, skills,
scripts, and documentation. It covers nothing else.

Content you fetch from an indexed source arrives under **that source's** license.
Two cases in the current catalog worth knowing about:

- **ComfyUI is GPL-3.0**, unlike the rest. Calling a running instance over its
  API is ordinary use. Embedding or redistributing it is a different question -
  read the license.
- **Curated lists link onward.** `design-resources-for-developers` is MIT, but the
  fonts, photos and templates it links to each carry the terms of wherever they
  live. Check the destination before shipping anything from it.

Model weights, typefaces, stock imagery and icon sets all carry their own terms,
independent of the repository that pointed you at them.

## On design references

Several sources analyse real companies' visual systems, and the `design-clone`
skill extracts systems from live sites. The line we hold:

**Learn the system. Do not take the identity.**

Type scales, spacing rhythm, palette relationships, motion character, component
patterns and the restraint behind them are craft. Studying good work is how
design has always been taught, and reimplementing a proportional system in your
own product is normal practice.

Logos, wordmarks, brand illustration, photography, custom icon sets, proprietary
typefaces and copy are identity. They belong to their owners. So does trade dress
- the overall look that makes a visitor believe they are on a particular
company's site.

Practically: build the interface that shares the reference's *qualities*, not one
that would be mistaken for it. If a reasonable person landing on your page would
think they were on the reference's page, you crossed the line.

The `design-clone` skill enforces this in its procedure, and `DESIGN.md` files it
produces carry a Provenance section stating what was extracted and what was not.
