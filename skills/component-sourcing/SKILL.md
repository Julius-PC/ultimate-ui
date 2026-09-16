---
name: component-sourcing
description: Find the best existing implementation of a UI component across the indexed libraries instead of hand-rolling one - checking the project's own codebase first, then the catalog's registries. Use before writing any modal, dropdown, combobox, date picker, toast, table, command palette, or other component with non-trivial keyboard, focus, or accessibility behaviour.
---

# Component Sourcing

Hand-rolled interactive components are where accessibility quietly dies. A
custom dropdown is fifteen minutes to make look right and several days to make
work right - focus trapping, arrow keys, type-ahead, escape, click-outside,
scroll locking, screen reader announcements, RTL, touch. Libraries have already
spent those days.

The rule: **search before you build.** Build only what genuinely does not exist.

## Components that should essentially never be hand-rolled

Dialog / modal · dropdown menu · select · combobox / autocomplete · date picker ·
tooltip · popover · toast · command palette · data table with sorting and
selection · carousel · tabs · accordion · slider · drag-and-drop.

If you are about to write one of these from scratch, stop and run this skill.

## Procedure

### 1. Check the project first

The best component is the one already in the repo. Before anything else:

```bash
ls components/ui src/components 2>/dev/null
grep -rl "Dialog\|Modal\|Popover" --include="*.tsx" --include="*.jsx" --include="*.vue" . | head
cat package.json | grep -A40 '"dependencies"'
```

If the project already has a UI library, use it. Introducing a second one to get
one component is a bad trade that someone will pay for later.

### 2. Query the catalog

```bash
node scripts/search.mjs --capability components --stack <stack> --json
node scripts/search.mjs --text "data table" --json
```

Read `avoid_when` on every candidate. It is the field that prevents the most
expensive mistakes - mixing styling models, or pulling an enterprise-weight
library into a small marketing site.

### 3. Check the registries for real

Do not rely on memory for what exists. Ask:

```bash
# shadcn/ui - every registry item, with per-item docs and API links
curl -s https://ui.shadcn.com/r/index.json \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      const q=(process.argv[1]||'').toLowerCase();
      JSON.parse(d).filter(x=>!q||x.name.includes(q)).forEach(x=>console.log(x.name, JSON.stringify(x.meta?.links||{})));
    })" combo

# the actual source of one component, for one style
curl -s https://ui.shadcn.com/r/styles/new-york-v4/button.json
```

Other indexed libraries expose agent-readable docs:

- Ant Design — `https://ant.design/llms.txt`
- Material UI — `https://mui.com/material-ui/llms.txt` (note the path segment;
  the site root has no `llms.txt`)
- Storybook — `https://storybook.js.org/llms.txt`

Or let a taste-informed skill pick: `pick-ui-library` in Emil Kowalski's set
exists precisely to stop agents hand-rolling toasts and installing abandoned
packages.

### 4. Choose on these criteria, in this order

1. **Already in the project.** Ends the search.
2. **Fits the styling model.** Tailwind project → copy-in Tailwind components.
   A theme-object library in a utility-class codebase means two competing
   systems and a maintenance tax forever.
3. **Accessibility is built in, not promised.** Check the docs for focus
   management and keyboard behaviour specifically.
4. **Maintained.** Check the last commit date, not the star count. Stars are
   lagging popularity, not current health.
5. **Themeable to the project's `DESIGN.md`.** A component you cannot restyle
   will be the one element on the page that looks wrong.

Bundle size matters on public pages and is close to irrelevant behind a login.
Weight it accordingly instead of applying it as a universal rule.

### 5. Install properly

Use the library's own installer. It handles dependencies, config and file
placement that pasted code will not:

```bash
npx shadcn@latest add combobox
```

Then adapt to the project's tokens. An installed component using default values
in a themed project is the tell that nobody finished the job.

### 6. When nothing fits

Genuinely custom components exist. Before committing:

- Start from a headless primitive that handles behaviour, and style it yourself.
  You want to own the appearance, not the focus trap.
- Write down what you are taking on: keyboard map, focus behaviour, ARIA roles,
  touch, RTL, reduced motion, screen reader announcements.
- Put it in Storybook with its states, so the next person can see it working
  before they change it.

## Reporting

Name what you chose, the one reason, its author and license, and the install
command. If you rejected an obvious candidate, say why in a clause - that is
what stops the same question being reopened next week.

## Failure modes

- **Recommending from memory.** Registries change. Fetch the index.
- **Ranking by stars.** Popularity is not fit, and it is not health.
- **Mixing styling models** to acquire one component.
- **Installing then not theming.** Half-done reads worse than not done.
- **Treating "accessible" as a claim rather than a check.** Tab through it.

## Credits

- **[shadcn/ui](https://github.com/shadcn-ui/ui)** by [shadcn-ui](https://github.com/shadcn-ui) (MIT) —
  registry index, per-component source, color scales, CLI. Its
  [registry directory](https://ui.shadcn.com/docs/directory) lists community registries
  built into the CLI, so check there before concluding something does not exist.
- **[Material UI](https://github.com/mui/material-ui)** by [MUI](https://github.com/mui) (MIT) —
  comprehensive React components; the heavy ones (data grid, pickers) are its strength.
- **[Ant Design](https://github.com/ant-design/ant-design)** by [Ant Design](https://github.com/ant-design) (MIT) —
  enterprise-class components; forms and tables with real behaviour built in.
- **[Skills For Designers and Engineers](https://github.com/emilkowalski/skills)** by
  [Emil Kowalski](https://github.com/emilkowalski) (MIT) — `pick-ui-library`, and `ask-sonner` for toasts.
- **[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** by
  [nextlevelbuilder](https://github.com/nextlevelbuilder) (MIT) — per-stack component catalogs, useful
  outside the React mainstream.
- **[Design Resources For Developers](https://github.com/bradtraversy/design-resources-for-developers)** by
  [Brad Traversy](https://github.com/bradtraversy) (MIT) — chart, animation and component-kit sections.
- **[Storybook](https://github.com/storybookjs/storybook)** by [Storybook](https://github.com/storybookjs) (MIT) —
  where a genuinely custom component earns its documentation.

Full attribution: [`CREDITS.md`](../../CREDITS.md).
