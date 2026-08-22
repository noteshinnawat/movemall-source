# Responsive Marketplace UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify desktop shopping chrome while making mobile discovery-led, with a visible Live rail and a readable, denser product feed.

**Architecture:** Retain existing routes, product data, `ProductCard`, and live-stream data. Change presentation through the existing `Navbar`, `HomePage`, `MobileBottomNav`, `App` composition, and their CSS; do not duplicate pages or introduce new state/data models. Remove global ticker and floating-live presentation only after the repository audit proves their only remaining purpose is replaced by the Home Live rail and dedicated Live route.

**Tech Stack:** React 19, TypeScript, React Router, Vanilla CSS, Node built-in test runner, Vite.

**Spec:** `docs/superpowers/specs/2026-08-22-responsive-marketplace-redesign.md`

## Global Constraints

- Reuse existing components and data; do not add routes, APIs, mock data, or a duplicate desktop/mobile page.
- Desktop primary navigation is Home, Shop, Mall, and Stores; Live and Video are not desktop peer navigation destinations.
- Mobile bottom navigation is Home, Live, Video, Cart, and Account.
- Do not claim platform-wide “100% genuine”; use verification wording only for data that actually carries the required status.
- Product grid targets: five columns on wide desktop Home, four on desktop Shop with filters, three/four on smaller desktop, two on mobile.
- Audit imports, routes, runtime references, and dependent flows before removing a component or style; run targeted checks after every removal.
- Preserve the existing 6px rectangular design system and Vanilla CSS-only styling.

---

### Task 1: Establish an auditable responsive-UI baseline

**Files:**
- Create: `tests/responsive-marketplace-ui.test.mjs`
- Inspect only: `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/MobileBottomNav.tsx`, `src/pages/HomePage.tsx`, and related CSS files

**Interfaces:**
- Consumes: the current source files as UTF-8 text via `node:fs/promises`.
- Produces: static regression checks for the agreed route destinations and responsive presentation markers.

- [ ] **Step 1: Write the failing static contract test**

  Create `tests/responsive-marketplace-ui.test.mjs` with these initial assertions; they deliberately fail until later tasks change the source.

  ```js
  import test from 'node:test';
  import assert from 'node:assert/strict';
  import { readFile } from 'node:fs/promises';

  const read = path => readFile(path, 'utf8');

  test('desktop chrome does not mount global ticker or floating live', async () => {
    const app = await read('src/App.tsx');
    assert.doesNotMatch(app, /LiveActivityTicker/);
    assert.doesNotMatch(app, /FloatingLiveWidget/);
  });

  test('mobile navigation keeps purchase and discovery destinations', async () => {
    const source = await read('src/components/MobileBottomNav.tsx');
    for (const path of ['to="/"', 'to="/live"', 'to="/video"', 'to="/cart"', 'to="/login"']) {
      assert.match(source, new RegExp(path.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')));
    }
  });

  test('homepage CSS defines five wide-desktop and two mobile product columns', async () => {
    const css = await read('src/pages/HomePage.css');
    assert.match(css, /@media \(min-width: 1200px\)[\s\S]*?\.products-grid\s*\{\s*grid-template-columns:\s*repeat\(5, 1fr\)/);
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.products-grid\s*\{\s*grid-template-columns:\s*repeat\(2, 1fr\)/);
  });
  ```

- [ ] **Step 2: Run the new test and record the expected baseline failure**

  Run: `node --test tests/responsive-marketplace-ui.test.mjs`

  Expected: the desktop-global-chrome and five-column assertions fail; record whether the existing mobile-navigation assertion passes before changing it.

- [ ] **Step 3: Audit removal candidates before touching presentation code**

  Run each command and record every import/use before removal:

  ```bash
  rg -n "LiveActivityTicker|FloatingLiveWidget|quick-access-bar|navbar__sub-bar" src tests
  rg -n "['\"]/(live|video|games|vouchers|flash-sale|compare|stores)['\"]" src/components/Navbar.tsx src/pages/HomePage.tsx src/App.tsx
  ```

  Keep the dedicated `/live`, `/video`, `/games`, `/vouchers`, `/flash-sale`, `/compare`, and `/stores` routes; this task only establishes that particular global presentation components can be removed without deleting any route or business capability.

- [ ] **Step 4: Commit the regression harness only**

  ```bash
  git add tests/responsive-marketplace-ui.test.mjs
  git commit -m "test: cover responsive marketplace shell"
  ```

### Task 2: Simplify desktop navigation and remove redundant global chrome

**Files:**
- Modify: `src/components/Navbar.tsx:170-451`
- Modify: `src/components/Navbar.css:23-360`
- Modify: `src/App.tsx:5-12, 451-456`
- Modify: `tests/responsive-marketplace-ui.test.mjs`

**Interfaces:**
- Consumes: existing localized route components (`LocalizedLink`), cart/wishlist/chat state, and `MobileBottomNav`.
- Produces: compact desktop navigation with no Live/Video peer navigation link and no ticker/floating-live global mount.

- [ ] **Step 1: Extend the failing test with desktop primary-nav exclusions**

  Add this test before altering `Navbar.tsx`:

  ```js
  test('desktop navigation keeps commerce destinations and omits discovery peers', async () => {
    const source = await read('src/components/Navbar.tsx');
    for (const path of ['to="/shop"', 'to="/mall"', 'to="/stores"']) assert.match(source, new RegExp(path));
    const subBar = source.slice(source.indexOf('navbar__sub-bar'), source.indexOf('</header>'));
    assert.doesNotMatch(subBar, /to="\/live"|to="\/video"/);
  });
  ```

- [ ] **Step 2: Run the test to verify it fails**

  Run: `node --test tests/responsive-marketplace-ui.test.mjs`

  Expected: the new desktop-navigation assertion fails because the existing sub-deals bar contains both `/live` and `/video`.

- [ ] **Step 3: Make the minimum source changes**

  In `Navbar.tsx`, replace the current desktop `navbar__sub-bar` set with links for `/shop`, `/mall`, and `/stores` only; retain seller/help/account/notification/chat/cart behavior already present in the utility and main bars. Remove now-unused `Ticket`, `Zap`, and any other icon imports made unused by the sub-bar reduction.

  In `Navbar.css`, keep the desktop/mobile visibility breakpoint at 768px, but make the reduced sub-bar a single compact row; do not introduce a new navigation component.

  In `App.tsx`, remove the `LiveActivityTicker` and `FloatingLiveWidget` imports and JSX mounts. Do not remove their route pages or live data. Remove their component files only if Task 1's audit confirms no remaining import/reference after this edit; otherwise leave unused presentation files in place and note them for a later isolated cleanup.

- [ ] **Step 4: Run targeted tests and compilation**

  Run:

  ```bash
  node --test tests/responsive-marketplace-ui.test.mjs
  npm run build
  ```

  Expected: all responsive-shell assertions and the TypeScript/Vite build pass.

- [ ] **Step 5: Manually verify critical desktop routes**

  At a viewport wider than 1200px, visit `/`, `/shop`, `/mall`, `/stores`, `/live`, and `/video`. Confirm Shop/Mall/Stores remain discoverable from desktop chrome; Live/Video pages still load by direct URL; cart, account, chat, and notifications remain accessible.

- [ ] **Step 6: Commit the desktop shell change**

  ```bash
  git add src/App.tsx src/components/Navbar.tsx src/components/Navbar.css tests/responsive-marketplace-ui.test.mjs
  git commit -m "feat: simplify desktop marketplace chrome"
  ```

### Task 3: Make the homepage product feed dense but readable

**Files:**
- Modify: `src/pages/HomePage.css:721-726, 1982-2000`
- Modify: `src/pages/ShopPage.css:92-98, 174-184`
- Modify: `tests/responsive-marketplace-ui.test.mjs`

**Interfaces:**
- Consumes: existing `.products-grid`, `.shop__grid`, and `ProductCard` markup.
- Produces: responsive grid presentation only; product data, card behavior, prices, badges, and cart callbacks do not change.

- [ ] **Step 1: Add a failing grid contract for Shop**

  Add this test:

  ```js
  test('shop grid provides four filtered cards on wide desktop and two on mobile', async () => {
    const css = await read('src/pages/ShopPage.css');
    assert.match(css, /@media \(min-width: 1200px\)[\s\S]*?\.shop__grid\s*\{\s*grid-template-columns:\s*repeat\(4, 1fr\)/);
    assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.shop__grid\s*\{\s*grid-template-columns:\s*repeat\(2, 1fr\)/);
  });
  ```

- [ ] **Step 2: Run the test to confirm the desktop Shop expectation fails**

  Run: `node --test tests/responsive-marketplace-ui.test.mjs`

  Expected: the four-column wide-Shop assertion fails because the current default is three columns.

- [ ] **Step 3: Apply CSS-only responsive grid changes**

  In `HomePage.css`, add an explicit `@media (min-width: 1200px)` rule for `.products-grid { grid-template-columns: repeat(5, 1fr); }`. Preserve the current 1024px three-column and 640px two-column rules; do not shrink `ProductCard` typography or remove seller/protection/price metadata to force density.

  In `ShopPage.css`, set the default/smaller-desktop grid to three columns, add an explicit `@media (min-width: 1200px)` rule with four columns, set the 768px-or-smaller grid to two columns, and preserve the one-column fallback only at a deliberately narrow breakpoint if the existing card controls cannot remain usable. Keep the filter sidebar behavior intact.

- [ ] **Step 4: Run tests and build**

  Run:

  ```bash
  node --test tests/responsive-marketplace-ui.test.mjs
  npm run build
  ```

  Expected: all assertions pass and no TypeScript/CSS bundling error occurs.

- [ ] **Step 5: Perform visual density checks**

  Verify `/` at 1440px shows five complete cards without clipped price, store, or verification information; `/shop` at 1440px shows four complete cards beside filters; both show two readable cards at 390px wide.

- [ ] **Step 6: Commit the grid change**

  ```bash
  git add src/pages/HomePage.css src/pages/ShopPage.css tests/responsive-marketplace-ui.test.mjs
  git commit -m "feat: tune marketplace product grid density"
  ```

### Task 4: Make Mobile Home discovery-led while retaining products and Live

**Files:**
- Modify: `src/pages/HomePage.tsx:361-430, 803-890`
- Modify: `src/pages/HomePage.css:325-374, 1771-1776, 1982-2000`
- Modify: `src/components/MobileBottomNav.tsx:29-99`
- Modify: `src/components/MobileBottomNav.css`
- Modify: `tests/responsive-marketplace-ui.test.mjs`

**Interfaces:**
- Consumes: `liveStreamsList`, `ProductCard`, existing `onAddToCart`, and `MobileBottomNav`'s `cartCount` prop.
- Produces: a mobile-only horizontal Live rail on Home and the fixed destination order Home → Live → Video → Cart → Account.

- [ ] **Step 1: Write failing static contracts for the Live rail and tab order**

  Add these tests:

  ```js
  test('mobile homepage Live rail can reveal up to five active streams', async () => {
    const source = await read('src/pages/HomePage.tsx');
    const css = await read('src/pages/HomePage.css');
    assert.match(source, /liveStreamsList\.slice\(0, 5\)/);
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.home-live-grid\s*\{[\s\S]*?overflow-x:\s*auto/);
  });

  test('mobile tabs are ordered Home, Live, Video, Cart, Account', async () => {
    const source = await read('src/components/MobileBottomNav.tsx');
    const orderedPaths = [...source.matchAll(/to="(\/[^\"]*)"/g)].map(match => match[1]);
    assert.deepEqual(orderedPaths.slice(0, 5), ['/', '/live', '/video', '/cart', '/login']);
  });
  ```

- [ ] **Step 2: Run the test to verify the current implementation fails**

  Run: `node --test tests/responsive-marketplace-ui.test.mjs`

  Expected: the Live cap and mobile-tab order tests fail because current Home renders four streams and tabs currently place Video before Live.

- [ ] **Step 3: Implement the minimal responsive changes**

  In `HomePage.tsx`, change only the Home Live list cap from four to five. Keep every card linked to `/live`; do not add a parallel Live feed or another data source.

  In `HomePage.css`, at `max-width: 640px`, render `.home-live-grid` as a horizontal, touch-scrollable row with fixed readable card width and `scroll-snap-type: x mandatory`; retain the desktop four-card grid at desktop widths. Ensure the existing product feed still follows the Live/discovery modules and remains a two-column grid on mobile.

  In `MobileBottomNav.tsx`, move the existing Live link before the existing Video link without changing either route, icon semantics, or cart behavior. In its CSS, keep the current safe-area spacing and ensure the five labels remain legible at 320px width.

- [ ] **Step 4: Run targeted tests and build**

  Run:

  ```bash
  node --test tests/responsive-marketplace-ui.test.mjs
  npm run build
  ```

  Expected: all tests pass and build succeeds.

- [ ] **Step 5: Manually verify mobile behavior**

  At 390px width, visit `/`: confirm Live appears directly after the existing hero/shortcut area, swipe the horizontal rail, scroll to the two-column product feed, add a product to cart, and confirm the Cart tab displays its count. Visit `/live` and `/video` from the reordered bottom navigation.

- [ ] **Step 6: Commit the mobile discovery slice**

  ```bash
  git add src/pages/HomePage.tsx src/pages/HomePage.css src/components/MobileBottomNav.tsx src/components/MobileBottomNav.css tests/responsive-marketplace-ui.test.mjs
  git commit -m "feat: prioritize live discovery on mobile"
  ```

### Task 5: Run the complete verification suite and document the audit outcome

**Files:**
- Modify if needed: `docs/superpowers/specs/2026-08-22-responsive-marketplace-redesign.md`
- Test: `tests/responsive-marketplace-ui.test.mjs` and existing project checks

**Interfaces:**
- Consumes: completed Tasks 1–4 and the existing project check command.
- Produces: a verified storefront redesign with documented retained/deleted global presentation components.

- [ ] **Step 1: Run all repository checks**

  Run: `npm run check`

  Expected: locale checks, lint, frontend build, Node tests, and backend build pass.

- [ ] **Step 2: Inspect the final deletion surface**

  Run:

  ```bash
  rg -n "LiveActivityTicker|FloatingLiveWidget" src tests
  git status --short
  ```

  Expected: no runtime import/mount remains. If component files remain unused, remove them and their CSS only after this command shows no import/reference; then rerun `npm run check`.

- [ ] **Step 3: Record only factual audit results**

  If a component was deleted, add its exact filename and the verification command used to the spec's implementation notes. Do not add a generic completion claim or unrelated documentation.

- [ ] **Step 4: Commit the verification/documentation result**

  ```bash
  git add src tests docs/superpowers/specs/2026-08-22-responsive-marketplace-redesign.md
  git commit -m "chore: verify responsive marketplace redesign"
  ```
