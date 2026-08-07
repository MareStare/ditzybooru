---
name: Ditzybooru
description: A modern frontend for Philomena boorus — nine accent themes and six user-owned appearance dials, all derived from a handful of seed values.
colors:
  seed-blue-dark: '#284371'
  seed-blue-light: '#2c74a9'
  seed-red-dark: '#923131'
  seed-red-light: '#b93232'
  seed-orange-dark: '#7a4a25'
  seed-orange-light: '#a85c15'
  seed-yellow-dark: '#5f5622'
  seed-yellow-light: '#8a6f10'
  seed-green-dark: '#226430'
  seed-green-light: '#257a42'
  seed-teal-dark: '#1f5f66'
  seed-teal-light: '#1f7b87'
  seed-purple-dark: '#36274e'
  seed-purple-light: '#71399b'
  seed-pink-dark: '#6d2b48'
  seed-pink-light: '#b83567'
  seed-gray-dark: '#2e3439'
  seed-gray-light: '#69747f'
  page-blue-dark: '#141a24'
  page-light: '#f8fafc'
  ink-dark: '#ececee'
  ink-light: '#333333'
  link-blue-dark: '#8cc4f0'
  link-blue-light: '#1f6ea6'
  link-hover-violet: '#b099dd'
  fave: '#a18e27'
  vote-up: '#5b9b26'
  vote-down: '#da3412'
  unread: '#ff8800'
  tag-general: '#4aa158'
  tag-rating: '#418dd9'
  tag-spoiler: '#d49b39'
  tag-origin: '#6f66d6'
  tag-oc: '#b157b7'
  tag-error: '#d45460'
  tag-character: '#4aaabf'
  tag-content-official: '#b9b541'
  tag-content-fanmade: '#cc8eb5'
  tag-species: '#b16b50'
  tag-body-type: '#b8b8b8'
  badge-staff: '#511b4e'
typography:
  display:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: 'calc(1.5rem * var(--font-scale))'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.011em'
  headline:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: 'calc(1.375rem * var(--font-scale))'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.011em'
  title:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: 'calc(0.9375rem * var(--font-scale))'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 'normal'
  body:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: 'calc(0.875rem * var(--font-scale))'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
  label:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: 'calc(0.6875rem * var(--font-scale))'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '0.02em'
  mono:
    fontFamily: "ui-monospace, 'Droid Sans Mono', menlo, monospace"
    fontSize: '0.92em'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 'normal'
rounded:
  xs: 'calc(var(--radius-unit) * 0.34)'
  sm: 'calc(var(--radius-unit) * 0.67)'
  md: 'var(--radius-unit)'
  lg: 'calc(var(--radius-unit) * 1.67)'
  full: '9999px'
spacing:
  0-5: 'calc(0.125rem * var(--density))'
  1: 'calc(0.25rem * var(--density))'
  1-5: 'calc(0.375rem * var(--density))'
  2: 'calc(0.5rem * var(--density))'
  3: 'calc(0.75rem * var(--density))'
  4: 'calc(1rem * var(--density))'
  6: 'calc(1.5rem * var(--density))'
components:
  button:
    backgroundColor: 'var(--surface-sunken)'
    textColor: 'var(--text-color)'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 'calc(0.375rem * var(--density)) calc(0.75rem * var(--density))'
    height: 'calc(32px * var(--density))'
  button-primary:
    backgroundColor: 'color-mix(in oklab, var(--base), var(--page) var(--w-chrome))'
    textColor: 'var(--text-color)'
    rounded: '{rounded.md}'
    padding: 'calc(0.375rem * var(--density)) calc(0.75rem * var(--density))'
    height: 'calc(32px * var(--density))'
  button-primary-hover:
    backgroundColor: 'color-mix(in oklab, var(--btn-color), var(--lift) 12%)'
    textColor: 'var(--text-color)'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: 'var(--text-muted)'
    rounded: '{rounded.md}'
    padding: 'calc(0.375rem * var(--density)) calc(0.75rem * var(--density))'
    height: 'calc(32px * var(--density))'
  button-ghost-hover:
    backgroundColor: 'var(--surface-hover)'
    textColor: 'var(--text-color)'
  field:
    backgroundColor: 'var(--surface-sunken)'
    textColor: 'var(--text-color)'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 'calc(0.375rem * var(--density)) calc(0.5rem * var(--density))'
    height: 'calc(36px * var(--density))'
    width: '100%'
  panel:
    backgroundColor: 'var(--surface)'
    textColor: 'var(--text-color)'
    rounded: '{rounded.md}'
    padding: '0'
  panel-header:
    backgroundColor: 'color-mix(in oklab, var(--base), var(--page) var(--w-chrome))'
    textColor: 'var(--text-color)'
    typography: '{typography.title}'
    padding: 'calc(0.375rem * var(--density)) calc(0.75rem * var(--density))'
    height: 'calc(36px * var(--density))'
  panel-tab-active:
    backgroundColor: 'color-mix(in oklab, var(--surface-panel-header), #fff var(--w-tab-active))'
    textColor: 'var(--text-color)'
    rounded: '{rounded.sm}'
  tag:
    backgroundColor: 'color-mix(in oklab, var(--tag-color), var(--surface) var(--tag-bg-mix))'
    textColor: 'color-mix(in oklab, var(--tag-seed), var(--lift) var(--tag-text-mix))'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: 'calc(0.125rem * var(--density)) calc(0.5rem * var(--density))'
    height: '24px'
  badge:
    backgroundColor: 'color-mix(in oklab, var(--badge-color), var(--surface) 76%)'
    textColor: 'color-mix(in oklab, var(--badge-color), var(--text-color) 62%)'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: '0 calc(0.375rem * var(--density))'
  menu-item:
    backgroundColor: 'transparent'
    textColor: 'var(--text-color)'
    typography: '{typography.body}'
    rounded: 'max(0px, calc(var(--radius-md) - var(--border-width)))'
    padding: 'calc(0.375rem * var(--density)) calc(0.75rem * var(--density))'
    height: 'calc(32px * var(--density))'
  nav-link:
    backgroundColor: 'transparent'
    textColor: 'color-mix(in oklab, var(--text-on-nav), var(--surface-nav) 18%)'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 'calc(0.375rem * var(--density)) calc(0.5rem * var(--density))'
  media-box:
    backgroundColor: 'var(--surface)'
    textColor: 'var(--text-color)'
    rounded: '{rounded.md}'
    padding: '0'
---

# Design System: Ditzybooru

## Overview

**Creative North Star: "The Tuned Instrument"**

Ditzybooru is not a palette; it is a machine that produces palettes. A theme
declares at most five colors — `--base`, `--page`, `--ink`, `--link`,
`--link-hover` — and every surface, border, chrome tint, text tier, panel strip,
tag wash and media frame in the site is a `color-mix()` away from those. Six
user-facing dials (`radius`, `borderWidth`, `shadow`, `density`, `fontScale`,
`motion`) feed `calc()` sitewide as unregistered custom properties. Turn one and
the site retunes: corners round, hairlines vanish, depth flattens, spacing
loosens. Eighteen theme combinations exist, and none of them is hand-painted.

The mood is familiar, warm and modernized. This is Derpibooru's shape language —
the two-row app bar, the tinted panel title strip, the dense interaction bar
under every thumbnail, the square corners — rebuilt in material that holds up.
Recognition is the point: a returning user should feel relief, not novelty. The
signature purple link hover, the fave gold, the upvote green and the downvote red
are muscle memory and are reproduced exactly.

Components are restrained and derived. A variant sets one seed custom property
(`--btn-seed`, `--tag-seed`, `--badge-seed`, `--notice-seed`) and its fill,
border and foreground follow; adding a variant costs one line. Character comes
from the consistency of that derivation, never from flourish. Two anti-references
are on record: the generic utility-framework look (Tailwind was removed
deliberately, and its defaults — universal `rounded-lg`, indigo accents, stock
`shadow-md` cards — are rejected with it), and Philomena's own contrast handling,
where tag labels land between 1.7:1 and 2.5:1 against their own wash. The
incumbent's shapes and colors are kept; its legibility debt is not.

**Key Characteristics:**

- Five color inputs per theme; every other color is derived.
- Square corners by default (`--radius-unit: 0px`) — rounding is the user's choice, not the system's.
- One formula per semantic color, written once for light and dark via the `--lift` / `--sink` direction pair.
- Dense, tabular, information-first: 0.875rem body, 24–36px control heights.
- Theme-tinted shadows, never neutral gray.
- WCAG 2 AA verified by axe-core in all nine accents × both polarities, as a gate.

## Colors

Nine accents × two polarities, each generated from a two-color seed pair; a
fixed, theme-invariant palette carries the meanings that must never shift.

### Primary

- **Accent Base** (`--base`, e.g. Twilight Navy `#284371` dark / Signal Blue `#2c74a9` light): the theme's identity, painted directly onto the top app bar and mixed toward the page for every piece of chrome — panel title strips, borders, the secondary nav, the primary button fill. It is the only saturated value present in every theme, which is why the shadow color derives from it rather than from the page.
- **Brand** (`--brand`): the base lifted 28% away from the background, so it reads against both the page and the saturated nav. Used for accent-color on native controls, the avatar fallback, the brand mark, the switch fill, and text selection.

### Secondary

- **Link** (`--link`, Sky Wash `#8cc4f0` dark / Deep Harbour `#1f6ea6` light): every anchor on the page. Links are never underlined; the color carries them alone, and its luminance distance from body text is what satisfies axe's `link-in-text-block` rule.
- **Muted Violet** (`--link-hover`, `#b099dd` in six of nine dark themes, `#9273d0` light): the signature hover. Derpibooru's link hover leaves the link's own hue for a violet, and that jump is a recognition cue.

### Tertiary

The interaction colors. Theme-invariant, byte-identical to Derpibooru's, and
load-bearing for muscle memory.

- **Fave Gold** (`#a18e27`): the favourite star.
- **Upvote Green** (`#5b9b26`): upvote glyph, positive scores, the donate link's tint, success badges.
- **Downvote Red** (`#da3412`): downvote glyph, negative scores, hide action, invalid fields.
- **Unread Orange** (`#ff8800`): the notification counter and unread markers.

Painted as 14px glyphs these bottom out around APCA Lc 26, so what actually
renders is each color lifted off the background (`--score-positive`,
`--score-negative`, `--fave-strong`). The raw values stay exact and still fill
the translucent active states.

### Neutral

- **Slate Mist** (`#f8fafc`): the shared light-theme page. Every light theme uses it; they differ only in base and links.
- **Graphite Ink** (`#333333`): light-theme foreground.
- **Bone** (`#ececee`): dark-theme foreground, shared by all nine dark themes.
- **Theme Page** (per-theme, e.g. `#141a24` blue, `#0c0c0c` gray): each dark theme sets its own near-black, tinted toward its accent.

Text tiers are derived by fading `--ink` toward the surface: muted at 20%,
subtle at 34%, disabled at 58%. These are far tighter than a conventional scale —
a 32/52/68 split put secondary text at Lc 45 on a tinted surface, which looks
fine on a bright monitor and fails measurement.

### Tag Categories

Eleven category seeds (`--tag-seed`) name a tag; none of them is the text color.
The label is the seed pushed along `--lift` by `--tag-text-mix`, and the wash and
border derive from that label. Hue survives, legibility is bought.

### Named Rules

**The Five Inputs Rule.** A theme file declares `--base`, `--page`, `--ink`,
`--link`, `--link-hover` and nothing else. Any color a new component needs is
derived in `tokens/semantic.css` from those five, from the polarity constants, or
from the fixed palette. A component that hardcodes a hex has bypassed the theme
system in eighteen themes at once.

**The One Formula Rule.** Semantic colors are written once, not once per
polarity. Move away from the background with `--lift`, toward it with `--sink`,
and vary only the mix weight (`--w-*`) between light and dark. If a value needs a
light branch and a dark branch, the missing abstraction is a weight, not an
`if`.

**The Muscle Memory Rule.** Fave gold, upvote green, downvote red and the violet
link hover are reproduced exactly and are never "modernized". They may be lifted
for legibility at paint time; their canonical values do not move.

## Typography

**Display / Body Font:** Inter Variable (with `system-ui`, `sans-serif`)
**Label/Mono Font:** `ui-monospace`, Droid Sans Mono, Menlo

**Character:** One family for everything, working through weight and size rather
than through contrast of voice. Inter is neutral to the point of transparency,
which is the job: the interface is chrome around user art, and a display face
would compete with it. Personality lives in density and color, not in letterforms.

### Hierarchy

- **Display** (600, `1.5rem × --font-scale`, 1.2, -0.011em): the page's `<h1>`. Rare — most surfaces are panel-titled rather than headed.
- **Headline** (600, `1.375rem × --font-scale`, 1.2, -0.011em): `<h2>`, section headings within a page.
- **Title** (600, `0.9375rem × --font-scale`, 1.2): panel headers. The panel title strip is the site's real heading system; a `<h3>` at `1.25rem` exists for prose contexts.
- **Body** (400, `0.875rem × --font-scale`, 1.45): everything. Nav links, buttons, table cells, menu items, comment text. This one value decides whether the site reads dense or cramped.
- **Label** (600, `0.6875rem × --font-scale`, 0.02em, uppercase): menu group labels, format markers, counter badges.

### Named Rules

**The Anchored Root Rule.** The document's font size is set on `<body>`, never on
`:root`. The whole scale is written in `rem`, so setting `font-size:
var(--text-sm)` on the root feeds the scale into itself and shrinks every token
by another 19%. `:root` stays at the browser's 16px, which is what the scale is
calibrated against.

**The Tabular Rule.** Anything whose digits change in place — scores, counters,
timestamps, numeric table columns — takes `font-variant-numeric: tabular-nums`.
A score that reflows as it increments is a layout bug.

## Layout

The shell is a flex column pinned to `100dvh`: sticky two-row header, content,
footer at the bottom of short pages. The header publishes its own height as
tokens (`--nav-bar-h`, `--nav-sub-h`, `--header-h`) so anything sticking below it
offsets by a constant rather than a `ResizeObserver`.

Spacing is a seven-step `rem` scale (0.125 / 0.25 / 0.375 / 0.5 / 0.75 / 1 /
1.5rem), every step multiplied by `--density` (0.85 compact / 1 cozy / 1.15
comfortable). The scale is deliberately short: gaps are 2 or 3, panel bodies are
3, page gutters are 4.

Breakpoints are named once in `tokens/breakpoints.css` as `@custom-media`, each
threshold declared exactly once as its `width >=` half, with the `--below-*` name
defined as the negation of that same name so a pair cannot drift and strand a
band of widths. Steps: `--xs` 480px (panel tabs begin to scroll), `--sm` 544px
(pagination keeps First/Last), `--md` 640px (header regains its wordmark and icon
shortcuts; footer opens to three columns), `--lg` 768px (secondary nav strip and
appearance menu exist; below, both fold into the burger drawer), `--xl` 960px
(room for a fixed control rail), `--2xl` 1024px (home page splits into activity
column plus grid), `--thumbs-roomy` 1150px (thumbnails grow from 150px to 225px).

Thumbnail grids are `repeat(auto-fill, minmax(150px, 1fr))` — columns are added
as the viewport widens rather than stretched, so thumbnail size stays constant.
The home page is one column in source order on a phone and a
`330px + minmax(0, 1fr)` grid above `--2xl`.

### Named Rules

**The Nearest Name Rule.** A component reaches for an existing breakpoint name
rather than inventing a width. A new step is added only when a layout genuinely
breaks where none of these describes — every threshold is another column of the
responsive matrix someone has to check.

**The Shrinkable Column Rule.** Any grid or flex child that contains a
thumbnail grid takes `min-inline-size: 0`. Without it the intrinsic width of the
contents pushes the sidebar off the viewport.

## Elevation & Depth

Depth is structural and theme-tinted. Shadows are not gray: `--shadow-color` is
`--base` mixed 22% toward black, so every shadow carries the theme's hue and
reads as part of the theme rather than as a generic drop shadow. `--base` is the
input rather than `--page` because it is the one value saturated in every theme —
the light themes' page is near-white and would carry no hue at all. At 22% the
result lands at L 0.07–0.15 across all ten bases, and every consumer fades it
further with an alpha.

Every shadow is multiplied by `--shadow-force` (0 = fully flat, 1.6 = heavy), so
depth is a user setting, not a fixed property of a component.

Elevation also reads as _lighter_, in both polarities: raised surfaces (menus,
popovers, the selected tab) mix toward literal white rather than along `--lift`.
On a light theme whose surface is already white this is a no-op and the shadow
does the work.

### Shadow Vocabulary

- **`--shadow-sm`** (`0 1px 3px @22%, 0 1px 2px @14%`, both scaled by `--shadow-force`): panels and the top app bar at rest. Barely there; it exists so a panel is not a flat rectangle.
- **`--shadow-md`** (`0 4px 12px @24%, 0 1px 3px @16%`): hover on a media card, and the panel's resting shadow when borders are switched off.
- **Menu shadow** (`0 12px 32px @30%`): the only genuinely lifted surface in the system. Popovers and dropdowns.
- **`--edge-highlight`** (`inset 0 var(--border-width) 0` tinted white at `--edge-alpha`): a 1px inner top highlight, 5% on dark themes and 0% on light ones. Cheap, and it is most of what separates a panel that looks lit from one that looks like a rectangle.

### Named Rules

**The Compensating Depth Rule.** Border weight and shadow force are independent
user settings, and either can be zeroed. Components that would dissolve at zero
compensate through `@container style()`: `style(--border-width: 0px)` promotes a
panel from `--shadow-sm` to `--shadow-md`; `style(--shadow-force: 0)` restores a
strong border color. Style queries compare token streams textually, so those
settings must be written in exactly the canonical form the query uses (`0px`,
`0`).

## Shapes

Square by default. `--radius-unit` ships at `0px` because hard corners are what
Derpibooru looks like, and this is a modernization of it rather than a departure.
Every radius token is a multiple of that unit — `xs` 0.34×, `sm` 0.67×, `md` 1×,
`lg` 1.67× — so a user who turns rounding up gets a proportional set rather than
a uniform one. `--radius-full` (9999px) is the exception and is reserved for
things that are conceptually circular: switches, badges, the notification
counter, the pulsing live dot.

Nested corners stay concentric by inset: a child inside a bordered parent takes
`max(0px, calc(var(--radius-md) - var(--border-width)))`, and the media card
publishes that as `--radius-inner` for its thumb and bar to consume.

Borders are a single hairline token (`--border`, `--border-width` solid
`--border-color`) with a subtler `--divider` for internal rules. Border color is
itself derived: base mixed toward the page at `--w-chrome`, with `strong`,
`subtle` and `input` variants lifted or faded from there.

`corner-shape: var(--corner-shape)` accompanies every `border-radius` —
progressive enhancement, Chromium-only today, ignored elsewhere.

### Named Rules

**The Square Default Rule.** Nothing hardcodes a radius. A component that wants
rounding names a radius token; a component that wants a circle names
`--radius-full`. Shipping a design that only looks right at a nonzero
`--radius-unit` breaks the default appearance.

## Components

### Buttons

- **Shape:** square by default (`--radius-md`, i.e. `--radius-unit`), 32px minimum height × `--density` — comfortably clear of the 24px WCAG 2.5.8 floor and the height every other control lines up on.
- **Derivation:** a variant sets `--btn-seed` and nothing else. Border is the fill mixed 22% toward `--lift`; hover mixes the fill 12% toward `--lift` and the border 34%; active darkens 8% toward black and drops the edge highlight.
- **Variants:** `--primary` (base mixed toward page at `--w-chrome`), `--success`, `--danger`, `--warning` (polarity status constants), `--ghost` (transparent, muted text, `--surface-hover` on hover).
- **Sizes:** `--sm` 28px / `--lg` 36px / `--icon` square via `aspect-ratio: 1` / `--block` full width.
- **Groups:** `.btn-group` welds a row into one control by collapsing the shared border with a negative margin and squaring the interior corners.

### Chips (Tags)

- **Style:** wash and border both derived from `--tag-color`, which is itself the category seed pushed toward `--lift`. Mix ratios (`--tag-bg-mix`, `--tag-border-mix`, `--tag-text-mix`) live on the theme root, not on `.tag`, so a theme can retune the whole tag system in one line.
- **Shape:** `--radius-sm`, 24px minimum height, label at 0.75rem / 500.
- **Count:** an inline `.tag-count` separated by a border rather than a gap, at normal weight and tabular figures.

### Cards / Containers

**Panel** (Philomena's `.block`) is the primary container: a tinted title strip
over a body.

- **Corner Style:** `--radius-md`, with `overflow: hidden` so the strip clips.
- **Background:** `--surface` body, `--surface-panel-header` strip (base mixed toward the page at `--w-chrome`, 36% dark / 80% light).
- **Shadow Strategy:** `--shadow-sm` plus `--edge-highlight` at rest; see the Compensating Depth Rule.
- **Internal Padding:** `--space-3` body, `--space-1-5 / --space-3` header; `--flush` zeroes it for list bodies.
- **Tabs:** sit _in_ the strip; the selected one lifts _out_ of it toward white rather than sinking into the body, because a selected tab must read as the lit one. Below `--xs` the strip scrolls rather than wrapping — a wrapped second row would push the grid down on every phone.
- **Footer:** a full-width centered link at 0.75rem / 500 that tints on hover.

**Media box** is the densest, most repeated element on the site: an interaction
bar over a square thumbnail. It cannot use `overflow: hidden` (the overflow menu
must escape), so the bar and thumb round their own outer corners from
`--radius-inner`. Border is `--surface-media` and lifts to `--shadow-md` on
hover; the image scales 1.03 under the same hover.

### Inputs / Fields

- **Style:** native elements styled as boxes, never re-created — keyboard handling, IME, autofill and AT semantics stay intact. `--surface-sunken` fill, `--border-color-input` hairline, `--radius-md`, 36px × `--density`.
- **Focus:** the site-wide ring — `2px solid var(--link)` at 2px offset, on `:focus-visible` only, so a mouse click never leaves a ring behind.
- **Error:** `:user-invalid`, never `:invalid` — a required-but-empty field is not flagged before the user has touched it.
- **Switch:** a pill (`--radius-full`) whose knob translates on `:checked`; fill becomes `--brand`, knob becomes `--text-on-nav`.

### Navigation

Two rows, as in Derpibooru.

- **Primary bar** sits on `--surface-nav` (the theme's base color, undiluted), so it uses `--text-on-nav` rather than `--text-color`, and hover states _darken toward black_ rather than lifting — a saturated mid-tone is not a background. Sticky at `z-index: 40` with `--shadow-sm`. Contains brand mark, embedded search field (on `--surface-nav-field`, a recess in the bar), and account actions.
- **Secondary strip** sits on a page surface instead, so it uses ordinary text tokens and lifts on hover. Below `--lg` it disappears entirely and its links move into the burger drawer.
- **Compaction order:** below `--md` the wordmark, upload shortcut and reverse-search button all lose to the search field, which is the reason the bar exists.
- **Donate link** is the one tinted item in a row of neutral ones: a 94%-diluted upvote-green wash with a green border and plain body text. The border and background say "donate"; the green itself would fail contrast on its own wash in the warmer themes.

### Segmented Control

The signature control of the appearance settings: a grid of `--segment-count`
stops with an absolutely positioned thumb that translates to
`--segment-index`. The stop a setting shipped with carries a small undo mark —
the same glyph the reset button uses — shown only once the user has moved off it,
and positioned absolutely so marking a stop never changes the track's width.

## Do's and Don'ts

### Do:

- **Do** derive every color from the five theme inputs, the `--w-*` weights, or the fixed palette. `color-mix(in oklab, …)` is the system's arithmetic.
- **Do** write one formula for both polarities using `--lift` / `--sink` and vary only the weight.
- **Do** give a new variant exactly one input (`--btn-seed`, `--tag-seed`, `--badge-seed`, `--notice-seed`) and derive fill, border and foreground from it.
- **Do** multiply every spacing value by `--density`, every type size by `--font-scale`, every duration by `--motion-scale`, and every shadow alpha by `--shadow-force`.
- **Do** name a breakpoint from `tokens/breakpoints.css` rather than writing a width.
- **Do** pair every `border-radius` with `corner-shape: var(--corner-shape)`.
- **Do** verify contrast in all nine accents × both polarities. `tests/a11y.test.ts` runs axe-core against the built site in a real browser, and zero violations is a gate.
- **Do** style native elements rather than reimplementing them, and use `:focus-visible`, `:user-invalid`, and `:has()` over JS-managed state classes.
- **Do** add every new stylesheet to the `@import` list in `styles/index.css` — a component's CSS lives next to its `.tsx`, but no `.tsx` imports CSS.
- **Do** use `:where()` for element-level defaults so component classes never have to fight base rules.

### Don't:

- **Don't** hardcode a hex in a component. It is wrong in eighteen themes at once. The narrow exceptions already in the system are documented at their site (tag category seeds, status constants, the `#000` overlays on media format markers).
- **Don't** "modernize" the fave, upvote, downvote or link-hover colors. They are recognition, not decoration.
- **Don't** hardcode a radius, a duration, a border width, or a raw `rem` gap past the settings tokens. A design that only looks right at `--radius-unit: 8px` is broken at the default of `0px`.
- **Don't** underline links. The color carries them, and its luminance distance from body text is what satisfies the accessibility rule.
- **Don't** set `font-size` on `:root`. See the Anchored Root Rule.
- **Don't** paint a raw category or interaction seed as text on a wash of itself — that is precisely Philomena's contrast failure. Push it along `--lift` first.
- **Don't** use `cover` on a booru thumbnail. `contain`, always: cropping a tall comic page to a square hides the part that identifies it.
- **Don't** reintroduce a utility CSS framework, or its default look — universal `rounded-lg`, stock indigo accents, neutral gray `shadow-md` cards. Tailwind was removed deliberately.
- **Don't** add a `*` reset beyond `box-sizing`. A blanket reset reaches into web components and other subtrees that then need `!important` to escape it.
- **Don't** let a wide table or tab strip widen the page. It scrolls inside its own box.
