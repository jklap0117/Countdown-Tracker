# Handoff: Milestone Tracker & Countdown App

## Overview
A personal milestone / countdown app for iPhone, shared between two people (Jordan and his wife Maddie). It tracks upcoming things worth looking forward to — trips, TV and movie releases, concerts, birthdays, sports, personal goals — grouped by month, filterable by category and by person, with a home-screen widget showing the next three items. Milestones auto-archive into a Past tab once they happen.

Target stack per the user: built by Claude Code, deployed free on **Netlify** (so a static-hosted web app — React + Vite is the natural fit; installable as a PWA so it lives on the home screen). The iOS widget is a native capability — see "iOS widget" below for what's actually shippable.

## Getting started

React + Vite + TypeScript. Requires Node 20+.

```bash
npm install
npm run dev
```

`npm run build` typechecks and builds to `dist/`; `npm run preview` serves that build; `npm run lint` runs oxlint. Netlify config is in `netlify.toml` (build `npm run build`, publish `dist`, SPA redirect).

### Sync setup (Supabase)

With no credentials the app runs on `localStorage` — single device, no sign-in. To sync between two phones:

1. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key. `.env.local` is gitignored.
2. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor. It creates the tables, the row-level security policies and the realtime publication.
3. Both people sign in with a magic link. Then pair the two accounts by inserting a row in `partners` **in each direction** — the Sharing screen will do this once it exists:
   ```sql
   insert into public.partners (user_id, partner_id) values ('<jordan-uuid>', '<maddie-uuid>');
   insert into public.partners (user_id, partner_id) values ('<maddie-uuid>', '<jordan-uuid>');
   ```
   User ids are in Dashboard → Authentication → Users.

**Visibility is enforced in the database, not the UI.** `who = 'me'` means private to whoever wrote it; because that lives in a `SELECT` policy, a private row is invisible to the partner in every query including `count(*)`. `who = 'maddie'` and `who = 'both'` are visible to both. A partner can edit or delete a shared item but cannot convert it into a private one.

### Layout

| Path | What it is |
| --- | --- |
| `src/` | The app. `App.tsx` is still a scaffold placeholder — replace it with the Upcoming screen. |
| `src/styles/organic-styles.css` | The Organic design system — tokens + component classes. Imported in `main.tsx`. Source of truth for every value below. |
| `src/index.css` | App base only: reset, the 402px centered column, focus ring. |
| `src/types.ts` | The data model from this doc. |
| `src/store/` | `MilestoneStore` is the seam; `localStore.ts` and `supabaseStore.ts` implement it. |
| `supabase/migrations/` | Schema and row-level security. Run in the Supabase SQL editor. |
| `design/` | Design references — prototypes, screenshots, mockup frame. Not built or linted. |

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior. They are *not* production code to lift directly. `.dc.html` files use a bespoke streaming-component runtime that will not exist in your codebase.

Your task is to **recreate these designs in a real environment**: pick the framework (React + Vite + TypeScript recommended for a Netlify static deploy), and rebuild the screens faithfully using its idioms. `organic-styles.css` (the design system stylesheet) **can** be used as-is — it is plain CSS custom properties plus component classes, and is the source of truth for every color, font, radius and shadow.

Open the prototypes in a browser to interact with them:
- `design/Milestone App.dc.html` — **the app**: the direction to build. Fully interactive: tab nav, filters, add flow, detail, delete, sharing setup, widget bucket picker.
- `design/Milestone Tracker (explorations).dc.html` — earlier explorations (three main-page layouts labelled 1a/1b/1c, plus add, detail and widget studies). **1a was chosen.** 1b (month bands) and 1c (timeline spine) are reference only — do not build them.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii and interactions are final. Recreate pixel-perfectly against the tokens in `organic-styles.css`. Device chrome in the prototypes (bezel, status bar, home indicator) is a mockup frame only — do not build it.

Design canvas: **402 × 874 px** (iPhone 16 Pro logical size). Content is edge-padded 20px. The layout should stretch gracefully to other phone widths; it is a phone-first app and does not need a desktop layout beyond centering a max-width column.

---

## Design tokens

All tokens live in `organic-styles.css` under `:root`. Never hard-code a value the tokens carry.

**Core**
| Token | Value |
| --- | --- |
| `--color-bg` | `#f5ead8` (page ground) |
| `--color-surface` | `#ebddc5` (cards, grouped rows) |
| `--color-text` | `#201e1d` |
| `--color-accent` | `#c67139` (terracotta) |
| `--color-accent-2` | `#7a8a5e` (sage) |
| `--color-divider` | `color-mix(in srgb, #201e1d 16%, transparent)` |

**Ramps** (100→900, each role on one perceptual lightness scale)
- neutral: `#f9f4ed #eee7db #dcd3c4 #c0b6a5 #a19786 #82796a #645c50 #474238 #2e2b25`
- accent: `#fff2eb #ffe1d0 #ffc6a5 #f6a06b #d67f48 #b2622d #8c491a #643312 #402310`
- accent-2: `#f0fae1 #e1eecc #ccdbb2 #aebf92 #8fa073 #728157 #56633f #3d472b #272e1b`

**Type** — `--font-heading: "Caprasimo"` (400 only, all display/numeric type), `--font-body: "Figtree"` (400/600/700). Both from Google Fonts.

Type used in the app:
| Role | Font / size / line-height |
| --- | --- |
| Screen title (`Coming up`, `Looking back`, `Sharing`) | Caprasimo 34px / 1.12 |
| Screen subtitle (tagline) | Figtree 13px, `--color-neutral-600` |
| Hero countdown number | Caprasimo 52px / 0.82 |
| Hero unit ("days") | Caprasimo 14px / 1.7, opacity .9 |
| Hero title | Caprasimo 19px / 1.15 |
| Row title | Caprasimo 19px / 1.2, ellipsis on overflow |
| Row meta (date · time) | Figtree 13px, `--color-neutral-600` |
| Row countdown number | Caprasimo 28px / 1 |
| Row countdown unit | Figtree 11px, `--color-neutral-600` |
| Month header | Figtree 11px, uppercase, letter-spacing .14em, `--color-neutral-600` |
| Section label (Category / Who's it for / When / Extras) | Figtree 11px, uppercase, letter-spacing .12em, `--color-neutral-600` |
| Detail countdown | Caprasimo 74px / 0.9 |
| Detail title | Caprasimo 30px |
| Tab bar label | Figtree 10px |

**Spacing** — `--space-1:4.4 --space-2:8.8 --space-3:13.2 --space-4:17.6 --space-6:26.4 --space-8:35.2` (px). Screen gutter is a flat 20px.

**Radius** — `--radius-sm:8 --radius-md:16 --radius-lg:28`. In practice: cards 26–28px, hero 28px, rows 22px, all buttons/pills/inputs `999px`. **No sharp corners anywhere.**

**Shadow** — `--shadow-sm/md/lg` only. Hero and floating action button use `--shadow-md` / `--shadow-lg`.

**Category colors** (fixed, one per category):
| Category | Color | Tint | Deep (text on tint) |
| --- | --- | --- | --- |
| Trips | `#c67139` | `#ffe1d0` | `#8c491a` |
| TV | `#7a8a5e` | `#e1eecc` | `#56633f` |
| Movies | `#8c491a` | `#ffe1d0` | `#643312` |
| Sports | `#56633f` | `#e1eecc` | `#3d472b` |
| Concerts | `#b2622d` | `#fff2eb` | `#8c491a` |
| Birthdays | `#f6a06b` | `#fff2eb` | `#8c491a` |
| Goals | `#8fa073` | `#f0fae1` | `#56633f` |

**Person colors** — Jordan `--color-accent-600` `#b2622d`; Maddie `--color-accent-2-600` `#728157`. Avatars are initial circles ("J", "M"), 24px in rows, 16px in the All pill, 62px on the sharing screen, each with a 2px ring in the surrounding background color; when both are shown the second overlaps the first by −8px.

---

## Data model

```ts
type CategoryId = 'trips'|'tv'|'movies'|'sports'|'concerts'|'birthdays'|'goals'|string; // user-creatable
type Who = 'me' | 'maddie' | 'both';

interface Milestone {
  id: string;
  title: string;
  cat: CategoryId;
  date: string;        // 'YYYY-MM-DD' (all-day) or 'YYYY-MM-DDTHH:mm' (timed)
  time: boolean;       // whether a time was set — time is OPTIONAL by design
  who: Who;
  notes?: string;
  link?: string;
  remind?: boolean;    // 1 week before, 9:00 AM
}
```

### Date rules — get these right, they were bugs in the prototype
1. **Always parse date-only strings as local**, not UTC: `new Date(s.length === 10 ? s + 'T00:00' : s)`. `new Date('2026-10-03')` is UTC midnight and renders a day early in western timezones.
2. **All-day items count whole calendar days** between local midnights:
   `Math.round((startOfDay(target) - startOfDay(now)) / 86400000)`. Timed items use `Math.floor(hoursUntil / 24)`.
3. An item is **past** when its instant is before now; past items leave Upcoming and appear in Past the same moment.

### Countdown copy
- `days >= 7` → `"69"` + `"days"`.
- All-day, `days < 7` → `"3"` + `"days"` / `"1"` + `"day"` / `"0"` + `"today"`.
- Timed, `days < 7` → `"3"` + `"days 14h"`; day-of → `"0"` + `"today · 6h"`.
- Past list uses relative copy: `today`, `yesterday`, `N days ago` (<30), `N months ago`.

### Date formatting
- Row / hero: `Sat, Oct 3` — plus ` · 8:20 PM` when timed.
- Detail: `Saturday, October 3, 2026` — plus ` at 8:20 PM` when timed.

---

## Screens

### 1. Upcoming (home)
**Purpose:** see everything ahead, grouped by month, filtered by person and category.

Vertical scroll, `--color-bg`, padding `58px 0 150px` (top clears the status bar, bottom clears tab bar + FAB).

1. **Header** — `Coming up` (Caprasimo 34px) + tagline `"7 things to look forward to"` (13px, neutral-600). The tagline counts the *filtered* list and pluralizes.
2. **Person filter** (20px gutter, 14px top, flex row, 10px gap):
   - **All** — a standalone pill *outside* the segmented track, deliberately a different shape of control because it is the superset, not a fourth peer. Caprasimo 13px, padding `9px 15px`, radius 999px. Inactive: transparent with `1px solid --color-neutral-400`, text neutral-700. Active: filled `--color-neutral-900`, text `--color-bg`. It carries the overlapped J+M avatar stack (16px) on its left; the avatar rings switch to neutral-900 when active.
   - **Jordan | Maddie | Shared** — a segmented track: `flex:1`, `background: --color-accent-2-200`, radius 999px, 3px padding, 2px gap; each option `flex:1`, 8px vertical padding, 13px Figtree. Active option: `--color-accent-2-600` fill, white text. Inactive: transparent, neutral-700.
   - Filter semantics: **All** = everything · **Jordan** = `who === 'me' || who === 'both'` · **Maddie** = `who === 'maddie' || who === 'both'` · **Shared** = `who === 'both'` only.
3. **Category pills** — horizontally scrolling row (hidden scrollbar), 8px gap, padding `12px 20px 16px`. `All` + one per category. Inactive: transparent, `1px solid --color-divider`, text color. Active: `--color-accent` fill, `--color-bg` text. Padding `9px 16px`, radius 999px, 13px Figtree, `white-space: nowrap`.
4. **Hero card** — the single next milestone in the filtered list. `--color-accent` fill, `--color-bg` text, radius 28px, padding `16px 18px 15px`, `--shadow-md`, `overflow:hidden`, plus a decorative `rgba(255,255,255,.11)` circle 170px at `right:-46px; top:-62px`. Contents: kicker row `UP NEXT · TRIPS` (10px, uppercase, letter-spacing .14em, opacity .85) with the person avatars right-aligned; then a baseline-aligned row with the big count (Caprasimo 52px) + unit on the left, and the title (19px) + date (12px, opacity .88) right-aligned. Tapping opens detail.
5. **Month groups** — everything *after* the hero, grouped by month in ascending order. Header row: `OCTOBER 2026` on the left, a 1px `--color-divider` rule filling the middle, item count (`"2 things"`) on the right. Rows: flex, 15px gap, padding `15px 8px`, radius 22px, hover `rgba(32,30,29,.05)`; a 6×52px `999px` bar in the category color; title + a meta line of `date · avatars`; right-aligned Caprasimo 28px count over an 11px unit.
6. **Empty state** — 74px `--color-accent-2-200` circle, `Nothing on the horizon` (Caprasimo 19px), and a hint that changes for the Shared bucket (`"Nothing shared yet — tag a milestone to both of you."`).

### 2. Past
Same shell and both filter rows (no category row). Header `Looking back` + `"4 milestones already behind you"`. Groups are **descending** (most recent month first) and items within them run newest → oldest. Rows are the Upcoming row at `opacity:.72` (full opacity on hover), 42px color bar at `.55` opacity, 17px title, and the right column is relative text (`16 days ago`) instead of a count. Empty state: neutral-200 circle, `No history yet`, `Milestones move here the day after they happen.`

### 3. Sharing
1. Header `Sharing` + status (`Linked with Maddie` / `Just you for now`).
2. **Pair card** — `--color-surface`, radius 28px, padding 20px, centered. Two 62px avatar circles overlapping by −16px, each with a 4px surface-colored ring. Linked state: `Jordan & Maddie` (Caprasimo 21px), explainer, and two tags — `5 shared milestones` (`.tag-accent-2`) and `Synced just now` (`.tag-neutral`). Unlinked state: `Invite Maddie` + invite explainer. Primary button (`.btn .btn-primary`, 48px) reads `Manage sharing` / `Send Maddie an invite`.
3. **What she can see** — a surface card of three rows, each: 34px initial circle, title + sub, and a switch. Rows: *Shared upcoming milestones* (on), *Shared history* (on), *Her reminders ping me too* (off, explicitly opt-in). Footer note: private milestones never leave your phone, not even in counts.
4. **Home screen widget** — bucket picker (`All / Jordan / Maddie / Shared`, four equal pills; active = `--color-neutral-900` fill) above a **live preview** of the medium widget on a wallpaper swatch. The widget bucket is **independent of the app's browsing filter** — changing one must not change the other.

### 4. Detail (pushed screen)
Back circle (38px, surface fill) top-left, `Edit` top-right. Then a 250px progress ring: SVG, r=112, 14px stroke, rotated −90°, track `--color-neutral-300`, progress in the item's **category color**, round cap, `stroke-dasharray` = `circumference × pct` (pct = elapsed share of the wait; past items render a full ring). Centered inside: Caprasimo 74px count + `DAYS TO GO` (or `DAYS AGO`). Below: hours / minutes / weeks in three columns split by 1px dividers. Then category tag + person tag, title (Caprasimo 30px), long date. Then a surface card with Notes and a meta row — `Reminder · 1 week before` for upcoming, `Happened · 16 days ago` for past. Two secondary buttons: `Add to calendar` (upcoming) or `Add photos` (past), and `Share`. A ghost `Delete milestone` at the bottom.

### 5. Add milestone (modal, full screen) — the most important screen
`Cancel` / `NEW MILESTONE` / spacer header. Then:
1. **Title** — borderless Caprasimo 28px input on a 1px underline, placeholder `What's coming up?`. (Keep the placeholder short — a longer one clips at 402px.)
2. **Category** — wrapping chips, one per category, active chip fills with **that category's color** and white text; plus a dashed `+ New` chip for creating a category.
3. **Who's it for** — three equal pills: `Jordan`, `Maddie`, `Jordan + Maddie`. Active = `--color-accent-2-600`. Below, a hint that changes per choice ("Syncs to Maddie's phone and widget." / "Hers — you'll still see it in All." / "Private to you.").
4. **When** — surface card: a `Date` row with a native date input; an `Add a time` row with a switch and the sub-label `Optional — leave off for all-day`; the `Time` row only exists when that switch is on. Below, three quick-date chips (`This weekend`, `Next month`, `A year out`) in `--color-accent-100`.
5. **Extras** — surface card: notes input, link input, and a `Remind me` switch (`One week before, 9:00 AM`, default on).
6. **Sticky footer** — full-width primary button 52px on a bottom-fading `--color-bg` gradient. Label is `Start the countdown`, or `Name it first` while the title is empty; saving is blocked until there's a title.

### Persistent chrome (Upcoming / Past / Sharing only — hidden on Detail and Add)
- **FAB** — 60px `--color-accent` circle, `right:20px; bottom:110px`, `--shadow-lg`, white plus glyph (Lucide `plus`, stroke-width 2.75). Hover `--color-accent-600`.
- **Tab bar** — 96px tall, `rgba(245,234,216,.92)` + `backdrop-filter: blur(16px)`, 1px top divider. Three tabs: **Upcoming** (Lucide `calendar`), **Past** (`clock`), **Sharing** (`users`) — 23px icons at stroke-width 2.75 over a 10px label. Active `--color-accent-700`, inactive `--color-neutral-500`.

---

## Interactions & behavior
- Tap any row or the hero → Detail. Back → Upcoming. Delete → removes the item and returns to Upcoming.
- FAB → Add (full-screen modal). Cancel or Save → Upcoming; Save appends the milestone, resets the draft, and it appears in its month group immediately.
- Category and person filters apply to Upcoming and Past simultaneously and persist across tab switches.
- Countdowns re-tick every 60s; anything crossing its instant moves from Upcoming to Past on the next tick.
- Every interactive element needs a themed hover/pressed state from the accent ramps and `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }` — never the browser default.
- Transitions: switches animate `background .2s`; keep motion subtle (150–200ms ease).

## State
```
items: Milestone[]            // persisted (localStorage, then a real store when sharing goes live)
screen: 'upcoming'|'past'|'share'|'detail'|'add'
person: 'all'|'me'|'maddie'|'both'      // browsing filter
cat: 'all'|CategoryId
selectedId: string|null
widgetPerson: 'all'|'me'|'maddie'|'both' // independent of `person`
linked: boolean                          // sharing pair state
rules: { upcoming: boolean; past: boolean; reminders: boolean }
draft: { title, cat, who, date, time, hasTime, remind, notes, link }
now: Date                                // ticked every 60s
```
The prototype seeds `now` to `2026-07-26T09:12` so the sample data reads correctly — in production use the real clock.

**Persistence / sync:** start with `localStorage`. For real two-person sharing on a free Netlify deploy, the practical options are Netlify Functions + a hosted Postgres/Redis, or a BaaS such as Supabase (free tier, row-level security, realtime). Shared items are rows both users can read/write; private items are readable only by their owner — the "she'll never see them, even in the count" promise must hold server-side, not just in the UI.

## iOS widget
A web app cannot ship a real iOS widget. Two honest paths:
1. **Native companion (true widget):** a small SwiftUI app + WidgetKit extension reading the same API. Medium widget = the next three; small = the next one. The bucket (All / Jordan / Maddie / Shared) is a widget configuration via `AppIntentConfiguration`, defaulting to the value set in the app's Sharing screen. Refresh on a timeline every 15–30 min plus a push-driven reload when data changes. Requires a paid Apple Developer account.
2. **PWA fallback (no dev account):** installable to the home screen with a themed splash and icon, plus a Live Activity–style pinned Safari view — no true widget. Recommend building the web app first and treating the widget as phase 2.

The prototype's widget preview is the visual spec either way: 22px-radius card on the wallpaper, `Coming up` title + bucket name, three rows of `4px color bar · title/meta · Caprasimo count`.

## Sample content used in the mocks
Australia Trip (Oct 3, 2026, all-day, shared) · NFL Season Kickoff (Sep 9, 8:20 PM, Jordan) · Apothecary Diaries S3 (Oct 17, Jordan) · Harry Potter series premiere (Dec 25, shared) · Weekend in Asheville (Jul 29, 3:00 PM, shared) · Mom's Birthday (Aug 14, Jordan) · Hozier at The Anthem (Sep 26, 7:30 PM, Maddie) · First half marathon (Nov 8, 7:30 AM, Maddie) · Dune: Part Three (Dec 18, shared). Past: Outer Banks beach week (Jun 20), Dad's 60th (May 30), Severance finale (Jul 10), Maddie's gallery show (Jul 18).

Copy tone throughout is **excited / anticipatory** but never cute — "things to look forward to", "Start the countdown", "Nothing on the horizon".

## Assets
- **Fonts:** Caprasimo 400 and Figtree 400/600/700 — Google Fonts, already imported at the top of `organic-styles.css`.
- **Icons:** [Lucide](https://lucide.dev) at **stroke-width 2.75** (`plus`, `calendar`, `clock`, `users`, `chevron-left`). The prototype hand-inlines close equivalents; use the real Lucide package.
- **Images:** none. The widget wallpaper is a CSS gradient placeholder.

## Files in this bundle
| File | What it is |
| --- | --- |
| `design/Milestone App.dc.html` | The app prototype — build this. Open in a browser and click through it. |
| `design/Milestone Tracker (explorations).dc.html` | Earlier explorations; 1a chosen, 1b/1c reference only. |
| `src/styles/organic-styles.css` | The Organic design system stylesheet — tokens + component classes. Usable as-is. |
| `design/ios-frame.jsx` | Device mockup frame used by the prototypes. **Not part of the product.** |
| `design/screens/` | Screenshots of each screen: upcoming, past, sharing, add milestone, detail. The device bezel and status bar are mockup chrome only. |
