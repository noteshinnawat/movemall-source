# Live-first Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the buyer homepage a visibly new Live-first presentation with a calm desktop browsing experience and a mobile-first live discovery experience.

**Architecture:** Keep `HomePage` as the only composition owner and reuse its current live-stream list, campaign data, product data, links, event handlers, and translated copy. Replace only the top-page composition and responsive styling; the existing flash sale, category, Mall, store, game, and product-feed data flows remain in place.

**Tech Stack:** React 19, TypeScript, React Router, i18next, Vanilla CSS, Vite, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-22-live-first-homepage-design.md`

## Global Constraints

- Change only buyer homepage presentation and responsive styling; do not add routes, APIs, mock data, or checkout changes.
- Reuse existing live streams, products, translations, links, and interaction handlers.
- Use white surfaces, Movemall blue for primary actions, and red only for Live/limited-deal signals.
- Keep established 6px card radius and Vanilla CSS.
- Use only bounded buyer trust copy; do not add platform-wide authenticity guarantees.
- Maintain Thai, English, and Myanmar translation key parity if any visible strings are introduced.
- Preserve accessible section semantics, existing accessible control names, keyboard access, focus visibility, image fallbacks, and touch-scrollable Live rail behaviour.

---

## File structure

- Modify: `src/pages/HomePage.tsx` — restructure the top-page hero and live entry point while continuing to consume the current `banners`, `subBanners`, `liveStreamsList`, `formatCurrency`, `formatCompactNumber`, `t`, and `Link` values.
- Modify: `src/pages/HomePage.css` — apply the new desktop editorial hero and Mobile Live-first layout using the existing breakpoint scheme.
- Modify only if new copy is unavoidable: `public/locales/{th,en,my}/catalog.json` — add the identical new keys in all three catalogs; prefer existing strings first.
- Verify: `tests/*.test.mjs`, `npm run build`, and browser checks at 1440px, 390px, and 320px.

### Task 1: Restructure the top-page composition around Live Edit

**Files:**
- Modify: `src/pages/HomePage.tsx:272-443`
- Test: local browser homepage at `http://127.0.0.1:<port>/th`

**Interfaces:**
- Consumes: existing `banners`, `subBanners`, `liveStreamsList`, `currentSlide`, `setCurrentSlide`, `setIsPaused`, `formatCompactNumber`, `formatCurrency`, `t`, and `Link`.
- Produces: `home-live-edit` and `home-live-rail` semantic sections styled by Task 2; all current CTA destinations remain unchanged.

- [ ] **Step 1: Record the baseline route and interaction behaviour**

Open `/th` and verify the existing campaign CTA routes to its `banner.ctaLink`, every live card routes to `/live`, and no JavaScript error prevents the flash-sale buttons from working. Record the current primary-nav links and Home grid columns at 1440px.

- [ ] **Step 2: Make the Live Edit composition change**

Replace the current top hero grid plus its separate Live title treatment with a single `home-live-edit` section. Keep the existing carousel and its buttons, but make a contextual preview from `liveStreamsList[0]` part of the desktop hero. Keep `home-live-rail` as the next section and render the same five streams with their existing `Link`, video, viewer, caption, and pinned-product fields.

```tsx
const featuredLive = liveStreamsList[0];

{featuredLive && (
  <Link to="/live" className="home-live-edit__preview" title={t('catalog:home.live.watchChannel', { channel: featuredLive.channelName })}>
    <video src={featuredLive.videoUrl} poster={featuredLive.coverImage} autoPlay loop muted playsInline />
    <span className="home-live-edit__status"><span /> LIVE NOW</span>
    <strong>{featuredLive.channelName}</strong>
    <span>{formatCompactNumber(featuredLive.viewers, locale)}</span>
  </Link>
)}
```

Do not alter carousel timing, CTA targets, live-card target route, flash-sale state, product feed state, or any product data.

- [ ] **Step 3: Check the changed behaviour in the browser**

At desktop width, click one campaign CTA and one live-preview/rail link. Expected: the CTA retains its original destination and both live entry points navigate to `/th/live` through localized routing. Go back after each navigation.

- [ ] **Step 4: Run the full automated suite**

Run: `npm test`

Expected: all existing tests pass, including locale catalog parity and buyer-source copy audit.

- [ ] **Step 5: Commit the composition change**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: compose homepage around live edit"
```

### Task 2: Implement distinct desktop and mobile visual systems

**Files:**
- Modify: `src/pages/HomePage.css:72-415, 1701-2035`
- Modify: `public/locales/th/catalog.json`, `public/locales/en/catalog.json`, `public/locales/my/catalog.json` only if Task 1 needs new visible labels
- Test: local browser at 1440px, 390px, and 320px

**Interfaces:**
- Consumes: the `home-live-edit`, `home-live-edit__preview`, and `home-live-rail` classes from Task 1, plus existing `home-live-*`, `products-grid`, and quick-access classes.
- Produces: responsive Live Edit hierarchy with no added routes or client data.

- [ ] **Step 1: Record the pre-style mobile constraints**

At 390px and 320px, record that the current mobile bottom navigation has no horizontal overflow and product cards have two computed grid columns. Keep these as non-regression checks after styling.

- [ ] **Step 2: Style the desktop Live Edit hierarchy**

Add styles at the existing hero/live style regions rather than creating a second stylesheet. At `min-width: 1200px`, make the campaign/carousel and live preview a two-column editorial composition. Use white surfaces, blue primary actions, a restrained red live indicator, 6px cards, and remove redundant framed presentation from the top zone.

```css
@media (min-width: 1200px) {
  .home-live-edit { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr); gap: var(--space-4); }
  .home-live-edit__preview { min-height: 300px; border-radius: var(--radius-md); overflow: hidden; }
  .home-live-rail { margin-top: var(--space-5); }
}
```

Keep the existing wide homepage product grid rule at five columns and do not change ShopPage styles.

- [ ] **Step 3: Style the mobile Live-first hierarchy**

At `max-width: 640px`, make the Live Edit section flow as a full-width hero followed by a horizontal, touch-scrollable five-room rail and then the normal product discovery flow. Keep its current `overflow-x: auto`, `scroll-snap-type: x mandatory`, and two-column product grid; do not place Live in desktop primary navigation.

```css
@media (max-width: 640px) {
  .home-live-edit { margin-inline: calc(-1 * var(--space-4)); }
  .home-live-edit__preview { display: block; min-height: 260px; border-radius: 0; }
  .home-live-grid { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .home-live-card { flex: 0 0 156px; scroll-snap-align: start; }
}
```

- [ ] **Step 4: Keep translations parallel if labels were added**

If a visible label could not reuse an existing key, add the exact same nested key path to `th`, `en`, and `my` `catalog.json` files. Use buyer-safe wording such as Thai `กำลังไลฟ์ตอนนี้`, English `Live now`, and Myanmar `တိုက်ရိုက်ထုတ်လွှင့်နေသည်`; do not add authenticity claims.

- [ ] **Step 5: Perform behavioural viewport verification**

Use the local browser and evaluate rendered layout rather than source text:

```js
({
  gridColumns: getComputedStyle(document.querySelector('.products-grid')).gridTemplateColumns.split(' ').length,
  liveRailOverflow: document.querySelector('.home-live-grid').scrollWidth > document.querySelector('.home-live-grid').clientWidth,
  bottomNavOverflow: document.querySelector('.mobile-bottom-nav').scrollWidth > document.querySelector('.mobile-bottom-nav').clientWidth,
})
```

Expected: 1440px homepage grid has five columns; 390px has a Live-first entry, overflowing/snap-enabled live rail, and two product columns; 320px bottom navigation has no overflow.

- [ ] **Step 6: Run automated verification**

Run: `npm test && npm run build`

Expected: tests report zero failures and Vite production build completes.

- [ ] **Step 7: Commit responsive styling**

```bash
git add src/pages/HomePage.css src/pages/HomePage.tsx public/locales/th/catalog.json public/locales/en/catalog.json public/locales/my/catalog.json
git commit -m "feat: add live-first responsive homepage"
```

### Task 3: Validate copy and safe removal boundaries

**Files:**
- Verify: `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/MobileBottomNav.tsx`
- Verify: `public/locales/{th,en,my}/{catalog,commerce,engagement}.json`
- Test: local browser Home and Mall routes

**Interfaces:**
- Consumes: earlier commits that removed the ticker/floating widget and bounded buyer trust claims.
- Produces: evidence that the homepage redesign preserves the desktop/mobile navigation decisions and has not reintroduced unsafe copy.

- [ ] **Step 1: Run the safe-reference audit**

Run:

```bash
rg -n "LiveActivityTicker|FloatingLiveWidget" src tests scripts
rg -n -i "แท้ 100%|100% authentic|ပစ္စည်းမှန် 100%" public/locales/{th,en,my}/{catalog,commerce,engagement}.json
```

Expected: no references to removed widgets and no buyer-facing unsupported platform-authenticity claims in the listed catalogs. Preserve product names, user reviews, operational/admin copy, and confirmed-counterfeit refund policy copy outside this audit scope.

- [ ] **Step 2: Verify buyer routes visually**

Open `/th` and `/th/mall` at 1440px and 390px. Expected: desktop primary navigation is Home/Shop/Mall/Stores; mobile bottom navigation is Home/Live/Video/Cart/Account; no ticker or floating live widget appears; Home and Mall show bounded trust language.

- [ ] **Step 3: Run final verification on the branch**

Run: `npm test && npm run build && git diff --check && git status --short`

Expected: 41 tests pass (or the current complete suite count), production build succeeds, diff check is clean, and no unintended tracked files are modified.

- [ ] **Step 4: Commit only if the audit changed tracked code**

```bash
git add src/App.tsx src/components/Navbar.tsx src/components/MobileBottomNav.tsx public/locales
git commit -m "test: verify live-first homepage boundaries"
```

If the audit finds no tracked changes, do not make an empty commit.
