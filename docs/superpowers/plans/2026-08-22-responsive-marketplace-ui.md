# Responsive Marketplace UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify desktop shopping chrome while making mobile discovery-led, with a visible Live rail and a readable, denser product feed.

**Architecture:** Retain existing routes, product data, `ProductCard`, and live-stream data. Change presentation through existing `Navbar`, `HomePage`, `MobileBottomNav`, `App`, and CSS; do not duplicate pages or add state/data models. Remove global ticker and floating-live presentation only after an audit proves their function is replaced by the Home Live rail and dedicated Live route.

**Tech Stack:** React 19, TypeScript, React Router, Vanilla CSS, Vite, existing Node test suite.

**Spec:** `docs/superpowers/specs/2026-08-22-responsive-marketplace-redesign.md`

## Global Constraints

- Reuse existing components/data; do not add routes, APIs, mock data, dependencies, or duplicate desktop/mobile pages.
- Desktop primary navigation: Home, Shop, Mall, Stores. Live and Video are not desktop peer navigation destinations.
- Mobile navigation: Home, Live, Video, Cart, Account.
- Do not claim platform-wide “100% genuine”; show verification wording only when backed by a real status.
- Grid targets: five wide-desktop Home columns, four wide Shop columns, three/four smaller-desktop columns, two mobile columns.
- Audit imports, routes, runtime references, and dependent flows before deletion. Remove only in independently verifiable commits.
- Preserve the existing 6px rectangular system and Vanilla CSS-only styling.
- Do not add source-text tests: this slice changes presentation rather than testable domain behavior. Validate via the existing suite, production build, and real viewport/route checks.

---

### Task 1: Establish the removal baseline

**Files:** Inspect `src/App.tsx`, `src/components/Navbar.tsx`, `src/pages/HomePage.tsx`, `src/components/MobileBottomNav.tsx`, and their CSS files. Do not create test files.

**Interfaces:** Consumes current imports, route links, shared product/live data, and shell components. Produces an audit record for each global presentation component considered for removal.

- [ ] **Step 1: Record every current presentation reference**

  ```bash
  rg -n "LiveActivityTicker|FloatingLiveWidget|quick-access-bar|navbar__sub-bar" src tests
  rg -n "['\"]/(live|video|games|vouchers|flash-sale|compare|stores)['\"]" src/components/Navbar.tsx src/pages/HomePage.tsx src/App.tsx
  ```

  Retain dedicated routes and their data; this audit concerns only global presentation mounts and desktop navigation links.

- [ ] **Step 2: Run the unmodified baseline**

  ```bash
  npm test
  npm run build
  ```

  Stop and investigate before editing if either command fails.

- [ ] **Step 3: Capture current route behavior**

  Start `npm run dev -- --host 127.0.0.1`; at 1440px and 390px load `/`, `/shop`, `/mall`, `/stores`, `/live`, and `/video`. Record desktop navigation and ticker/floating-live presence for comparison.

### Task 2: Simplify Desktop navigation and global chrome

**Files:** Modify `src/components/Navbar.tsx:170-451`, `src/components/Navbar.css:23-360`, and `src/App.tsx:5-12,451-456`.

**Interfaces:** Consumes `LocalizedLink`, cart/wishlist/chat state, and existing breakpoints. Produces compact desktop navigation with no global ticker/floating-live mount; Live/Video routes remain available by direct URL and homepage/mobile discovery.

- [ ] **Step 1: Confirm the audit permits removal**

  Verify ticker and floating widget have no role beyond their global `App.tsx` mounts. If another route imports either component, stop and retain it until that route is reviewed.

- [ ] **Step 2: Make minimum source changes**

  Reduce the desktop `navbar__sub-bar` to `/shop`, `/mall`, and `/stores`; retain existing seller/help/account/notification/chat/cart controls. Remove only now-unused icon imports. Keep the 768px responsive breakpoint and use a compact single-row sub-bar.

  Remove ticker and floating-live imports/mounts from `App.tsx`. Do not delete their files yet and do not remove live routes/data.

- [ ] **Step 3: Verify the behavior**

  Run `npm test && npm run build`. At 1440px confirm `/` exposes Shop, Mall, Stores, search, account, notifications, chat, and cart; `/live` and `/video` render directly; no ticker/widget overlays a buyer page.

- [ ] **Step 4: Delete only proven-unused files**

  Run `rg -n "LiveActivityTicker|FloatingLiveWidget" src tests`. If no import or runtime reference remains, delete the corresponding `.tsx` and `.css` component pairs. Otherwise retain them and document the remaining reference.

- [ ] **Step 5: Verify and commit**

  Run `npm test && npm run build`, then stage changed/deleted paths only and commit:

  ```bash
  git add -u src/App.tsx src/components
  git add src/components/Navbar.tsx src/components/Navbar.css
  git commit -m "feat: simplify desktop marketplace chrome"
  ```

### Task 3: Increase product density without removing card information

**Files:** Modify `src/pages/HomePage.css:721-726,1982-2000` and `src/pages/ShopPage.css:92-98,174-184`.

**Interfaces:** Consumes `.products-grid`, `.shop__grid`, and existing `ProductCard` markup. Produces CSS-only column changes; callbacks, price, seller, badge, and buyer-protection content remain unchanged.

- [ ] **Step 1: Capture card readability baseline**

  At 1440px inspect the first row of `/` and `/shop`; confirm the image, seller/verification context when present, title, price, and cart action are readable.

- [ ] **Step 2: Add explicit wide-desktop rules**

  Add to `HomePage.css`:

  ```css
  @media (min-width: 1200px) {
    .products-grid { grid-template-columns: repeat(5, 1fr); }
  }
  ```

  Preserve existing 1024px three-column and 640px two-column rules. In `ShopPage.css`, retain three columns below the wide breakpoint, add `@media (min-width: 1200px) { .shop__grid { grid-template-columns: repeat(4, 1fr); } }`, and use two columns at 768px or less. Preserve one column only at the narrowest point where controls cannot fit.

- [ ] **Step 3: Verify layout behavior**

  Run `npm run build`. Verify five complete Home cards at 1440px, four complete filtered Shop cards at 1440px, two complete cards at 390px, and filters still apply/clear.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/HomePage.css src/pages/ShopPage.css
  git commit -m "feat: tune marketplace product grid density"
  ```

### Task 4: Make Mobile Home discovery-led while retaining purchase flow

**Files:** Modify `src/pages/HomePage.tsx:361-430,803-890`, `src/pages/HomePage.css:325-374,1771-1776,1982-2000`, `src/components/MobileBottomNav.tsx:29-99`, and `src/components/MobileBottomNav.css` only if labels overlap at 320px.

**Interfaces:** Consumes `liveStreamsList`, existing `ProductCard` callbacks, and `MobileBottomNav` `cartCount`. Produces a horizontal Home Live rail with up to five streams and tab order Home → Live → Video → Cart → Account.

- [ ] **Step 1: Confirm the Live section is reusable**

  Verify `.home-live-grid` already reads `liveStreamsList` and links each card to `/live`; reuse it rather than adding a second data source, carousel, or route.

- [ ] **Step 2: Apply minimum responsive presentation changes**

  Change the existing Home Live cap from four to five. At `max-width: 640px`, make `.home-live-grid` a horizontal touch-scrollable rail with fixed readable card width and `scroll-snap-type: x mandatory`; keep the desktop four-card grid and existing two-column mobile product feed.

  Move the existing Live link before Video in `MobileBottomNav.tsx`. Do not change routes, account destination, cart count, labels, or safe-area behavior.

- [ ] **Step 3: Validate mobile end-to-end**

  Run `npm test && npm run build`. At 390px and 320px: swipe the Home Live rail; open a room; scroll into the product feed; add a product and confirm Cart count changes; open `/live` and `/video` from tabs; confirm no global overlay covers bottom navigation.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/HomePage.tsx src/pages/HomePage.css src/components/MobileBottomNav.tsx src/components/MobileBottomNav.css
  git commit -m "feat: prioritize live discovery on mobile"
  ```

### Task 5: Complete safe-removal audit

**Files:** Modify `docs/superpowers/specs/2026-08-22-responsive-marketplace-redesign.md` only for factual deletion/retention outcomes.

**Interfaces:** Consumes Tasks 1–4 and the repository check command. Produces a verified UI slice and exact record of removed/retained presentation components.

- [ ] **Step 1: Run complete verification**

  Run `npm run check`. Locale checks, lint, frontend build, Node tests, and backend build must all pass.

- [ ] **Step 2: Inspect deletion safety**

  ```bash
  rg -n "LiveActivityTicker|FloatingLiveWidget" src tests
  git status --short
  ```

  If a runtime reference remains, restore/retain its component. Do not remove backend routes, data models, or business workflows in this UI slice.

- [ ] **Step 3: Document factual outcomes and commit when needed**

  Add only actual deleted/retained component names and the command used to the spec, rerun `npm run check`, then commit:

  ```bash
  git add docs/superpowers/specs/2026-08-22-responsive-marketplace-redesign.md
  git commit -m "chore: document responsive UI audit"
  ```

  If no factual spec change is needed, do not create an empty commit.
