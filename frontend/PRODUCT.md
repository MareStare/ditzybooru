# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Newcomers and casual visitors** are the primary focus. They don't know how a
booru works, so the design must teach tags, search queries, filters, watched
tags, complex queries, and faves — including how a fave differs from an
upvote. The tag and search vocabulary is the steepest part of that climb and
the most valuable thing to reach the top of.

**Taggers** — anyone correcting or completing an image's tags — are the users
the whole corpus depends on. Tagging is open: any visitor, signed in or not,
may edit the tags on any image. Tag editing is therefore not an admin tool
tucked behind a permission check; it is a primary, always-available action
that must be fast, forgiving, and obvious on every image.

**Existing Derpibooru users** are an equal priority. The site must feel
familiar to them. They want the same content through a modern,
faster, less dated interface.

**Self-hosters** running their own Philomena instance are secondary:
Ditzybooru works against any Philomena-based backend, so nothing may hardcode
Derpibooru-specific content, branding, or navigation.

## Product Purpose

An alternative web frontend for Philomena-based image boorus. The production
instance (https://ditzybooru.org) is backed by Derpibooru.

**What makes a booru worth using is its search, and what makes its search
worth using is its tags.** This is the product's centre of gravity. A
Philomena corpus is exhaustively tagged — artist, character, species, rating,
origin, content source, body type, and free-form descriptive tags, dozens per
image — and it stays that way because tagging is open to everyone, including
unauthenticated visitors, on every image. That corpus feeds a query language
that goes far past keyword matching: boolean operators, negation,
parenthesised nesting to arbitrary depth, field-qualified terms over numeric
and date metadata, wildcards and fuzzy matching. A fluent user does not browse
to find an image; they describe it.

Ditzybooru's job is to make both halves of that loop first-class: tagging that
is quick enough that a passing visitor actually fixes what they noticed, and a
query surface that makes a nested expression readable, editable, and
learnable rather than a string typed blind into a box.

It stores no content of its own: images, comments, profiles, and votes live on
the origin server, reached through a Rust proxy backend that translates
Philomena's server-rendered HTML into a JSON REST API. Users may optionally
log in with their origin-server account; favourites, uploads, and comments
stay in sync both ways.

Success criteria: a Derpibooru user prefers Ditzybooru for daily browsing with nothing
they relied on missing; a first-time visitor can find images by tag and
build a filtered feed without outside help; and a visitor who spots a missing
or wrong tag can fix it without an account and without leaving the image.

Longer-term ambition: a React SSR frontend good enough to be adopted upstream
by Philomena, or to serve as the basis for one.

## Positioning

Five things together, none of which the upstream frontend offers:

1. **The best interface anywhere for Philomena's search and tagging.** The
   query language and the tag corpus are the platform's outstanding assets and
   its most under-served ones: upstream exposes them through a plain text
   input and a plain text area. Ditzybooru treats them as the product.
2. **Modern look at feature parity** — the same capabilities, not a subset.
3. **Faster and app-like** — a React SPA against a multipage Phoenix app.
4. **Extra features upstream lacks**, on top of parity.
5. **Deep customization** — themes and display settings as a product
   feature, not a developer convenience.

## Operating Context

Browsing is the core loop: an activity/home page of featured, trending, and
watched images plus forum and comment activity; thumbnail grids; image pages;
tag search and filters; forums and comments.

**Search and tagging run through all of it.** A query is not a one-off action
at the top of a results page — it is state the user refines over a session,
saves as a watched tag, and reuses as a filter. Tags appear on every image
page as the primary metadata, are clickable into a query from anywhere they
render, and are editable in place. The two are one loop: better tags make
sharper queries, and a query that returns the wrong thing is usually a tagging
defect the searcher is positioned to fix.

Query complexity has a long tail. Most sessions are one or two tags; a
meaningful minority are deeply nested expressions mixing negation, grouped
alternatives, and metadata bounds, typed by users who know exactly what they
want. Both ends must be served by the same surface — the simple case may not
be taxed to support the complex one, and the complex one may not be
amputated to keep the simple one tidy.

Sessions are mixed-device and often long. Content is user-uploaded art of
widely varying aspect ratio, format (including animated GIF/WebM), and
subject matter, so layouts must survive real, uncurated media rather than
uniform sample assets. Tag lists are equally uncurated: an image may carry
five tags or two hundred, and tag names range from a single word to a long
hyphenated phrase.

## Capabilities and Constraints

- **Philomena data model is authoritative.** Entities and data shapes come
  from the origin server; the frontend may not invent entities. It may use
  better domain terms where the new design establishes them intentionally.
- **Philomena's search grammar is authoritative.** The query language belongs
  to the origin server, which parses and executes it. Ditzybooru may build any
  interface on top — a structured builder, inline hints, live validation,
  visualised nesting — but every query it produces must be expressible as the
  plain text string Philomena accepts, and a user who types that string by
  hand must never be worse off than one using the builder. The frontend does
  not invent operators or a dialect of its own.
- **Tag editing is open by design.** Any visitor may edit tags on any image,
  authenticated or not. This is the origin server's rule, not a setting to
  work around: the UI must not gate tag editing behind sign-in, and must
  assume edits arrive from anonymous, inexperienced, and occasionally
  destructive hands. Undo, history, and clear attribution matter more here
  than a confirmation dialog would.
- **Tag categories are a fixed, styled vocabulary.** Eleven categories
  (rating, spoiler, origin, OC, error, character, official content, fanmade
  content, species, body type, general) each carry a colour that identifies
  them at a glance. Categories come from the origin server; the colours are
  recognition and are documented in DESIGN.md.
- **No standalone data store.** All reads and writes proxy to the origin
  server through Ditzybooru's Rust backend, and must work against any
  Philomena instance.
- **Nine accent themes × light/dark.** Every design holds up in all
  combinations; contrast is verified per theme.
- **Six display settings stay functional.** `radius`, `borderWidth`,
  `shadow`, `density`, `fontScale`, `motion` are unregistered custom
  properties feeding `calc()` sitewide; nothing may hardcode past them.
  `radius: 0` by default because square corners are what Derpibooru looks
  like, and this is a modernization of it, not a departure.
- **Mobile-first responsiveness.** Phone layout is a first-class target.
- **Stack:** React 19, TanStack Router, Vite, raw CSS with a token layer
  (`src/styles/tokens/`, `src/styles/themes/`). Tailwind was removed
  deliberately; do not reintroduce a utility framework. TypeScript only.
- **Planned, not built:** SSR. Real API wiring — the home page renders from
  `src/lib/mock/`. Search, the image page, tag editing, forums and upload do
  not exist yet in any form beyond the header's placeholder field. The search
  and tagging surfaces are the product's defining feature and its largest
  unbuilt area at once; nothing here describes shipped behaviour.

## Brand Commitments

Ditzybooru, licensed AGPL-3.0 like Philomena. Typeface in use: Inter Variable.

The visual relationship to Derpibooru is intentional continuity, not
imitation: the familiar booru brought up to date.

## Evidence on Hand

- Working home/activity page and a `/ui/playground` route exercising the
  token and component system (`src/components/`, `src/styles/`).
- Mock data at `src/lib/mock/`, shaped like Philomena API responses, with
  thumbnails from the public Derpibooru CDN (Philomena's development seeds).
- Accessibility suite at `tests/a11y.test.ts` — axe-core against the built
  site in a real browser, run across every theme.
- No search, tag-editing, or image-page code exists yet. The header's search
  field is a placeholder that submits nowhere, and the tag component
  (`styles/components/tag.css`) renders categories but has no editing
  affordance. Everything this document says about search and tagging is
  intent, not observed behaviour.
- No testimonials, usage numbers, benchmarks, or performance claims exist.
  Future work must not fabricate them.

## Product Principles

1. **Familiar first, but not bug-for-bug.** Keep what Derpibooru users
   recognise where it is good; replace what is not.
2. **Teach in place.** Booru mechanics are learned from the interface, on
   demand, and recede once the user is fluent. The query language is the
   primary thing being taught: syntax help belongs beside the query the user
   is writing, not in a documentation page they must go and find.
3. **Search and tagging carry the site.** When a decision trades against
   either, they win. A surface that shows tags makes them clickable and
   editable; a surface that lists images gets there from a query the user can
   see and change.
4. **Anyone can tag, so tagging must survive anyone.** The path to a correct
   tag is short and unauthenticated; the path back from a bad one is
   shorter still.
5. **Parity before invention.** A feature upstream has and Ditzybooru lacks is
   a defect. Extras come after, not instead.
6. **The user owns the interface.** Every new surface survives all themes and
   display settings.
7. **Speed is a feature.** Weight and jank are product bugs. A query that
   feels slow is a query the user stops refining.
8. **Origin server is the source of truth.** The frontend presents Philomena
   data, and Philomena parses the queries; it does not own either.

## Accessibility & Inclusion

WCAG 2 AA, verified by axe-core with zero violations in every accent theme in
both light and dark. A gate, not an aspiration. The `motion` setting lets
users reduce animation directly, alongside `prefers-reduced-motion`.

Search and tag editing raise the bar rather than lower it. A nested query is
structured content: whatever visual treatment expresses its nesting must also
be conveyed to assistive technology, and the query must remain fully editable
from the keyboard alone. Tag category colour is never the only carrier of
meaning — the category is available as text. Autocomplete, if it exists,
follows the combobox pattern properly or does not ship.
