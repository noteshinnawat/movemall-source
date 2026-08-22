# Buyer Radius Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make discrete buyer-facing UI surfaces consistently use 6px corners without altering intentional pill, circular, or full-bleed media shapes.

**Architecture:** Keep the existing CSS token scale and apply `var(--radius-md)` to the shared buyer primitives and page-specific discrete surfaces. Audit each legacy zero-radius declaration by selector intent; retain only full-bleed media, circular UI, and pill tags as exceptions.

**Tech Stack:** React 19, TypeScript, Vite 8, Vanilla CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-22-buyer-radius-standard.md`

## Global Constraints

- Default rectangular buyer UI surface uses `var(--radius-md)` (6px).
- Keep compact pill labels, avatars, status dots, and full-bleed video/screens in their functional shapes.
- Do not change layout, interactions, copy, or data.
- Exclude Seller Centre and Admin operational UI.

---

### Task 1: Establish shared buyer primitives

**Files:**
- Modify: `src/styles/components.css`
- Modify: `src/components/Navbar.css`, `src/components/FilterSidebar.css`, `src/components/SkeletonCard.css`

**Interfaces:**
- Consumes: existing `--radius-md` token from `src/styles/variables.css`.
- Produces: consistent 6px default for shared buyer cards, buttons, badges, inputs, menus, filters, and loading surfaces.

- [ ] **Step 1: Capture the failing visual baseline**

Run the local Vite server and inspect the desktop home route. The shared `.btn` and `.card` computed `border-radius` should be below the required 6px before the change.

- [ ] **Step 2: Apply minimal shared CSS changes**

Change only shared discrete-surface selectors from `var(--radius-sm)` or `0` to:

```css
border-radius: var(--radius-md);
```

Keep selector-specific pills and circular markers unchanged.

- [ ] **Step 3: Verify the shared behavior**

Reload the desktop home route and confirm a shared button/card computes to `6px`, with no change to the circular cart counter.

### Task 2: Normalize commerce and account surfaces

**Files:**
- Modify: `src/pages/HomePage.css`, `src/pages/ShopPage.css`, `src/pages/ProductDetailPage.css`, `src/pages/StorePage.css`
- Modify: `src/pages/CartPage.css`, `src/pages/CheckoutPage.css`, `src/pages/WishlistPage.css`, `src/pages/OrdersPage.css`, `src/pages/NotificationsPage.css`, `src/pages/ComparePage.css`
- Modify: `src/components/ReviewsSection.css`, `src/components/CartItem.css`, `src/components/ProductPickerModal.css`, `src/components/PromptPayModal.css`, `src/components/ShippingLabelModal.css`, `src/components/VisualSearchModal.css`

**Interfaces:**
- Consumes: shared 6px standard from Task 1.
- Produces: product, cart, checkout, and dialog containers with matching corners.

- [ ] **Step 1: Capture the failing visual baseline**

Inspect a product and checkout route before the change. At least one product panel, form control, or modal must compute to `0px`.

- [ ] **Step 2: Apply selector-level radius changes**

For each zero-radius declaration, replace discrete cards, thumbnails, controls, inputs, callouts, drawers, and dialogs with:

```css
border-radius: var(--radius-md);
```

Do not alter full-width layout regions, scrollbar thumbs, avatars, or compact labels that intentionally remain pills.

- [ ] **Step 3: Verify the commerce behavior**

At desktop and 390px mobile widths, confirm product and checkout cards/controls compute to `6px` and retain usable layout.

### Task 3: Normalize discovery and engagement surfaces

**Files:**
- Modify: `src/pages/FlashSalePage.css`, `src/pages/VouchersPage.css`, `src/pages/GamesPage.css`, `src/pages/HelpCenterPage.css`, `src/pages/ChatPage.css`
- Modify: `src/pages/LiveStreamPage.css`, `src/pages/VideoFeedPage.css`, `src/pages/VideoStudioPage.css`
- Modify: `src/components/LiveStreamCard.css`, `src/components/VideoClipInGridCard.css`, `src/components/YellowBasketModal.css`, `src/components/MobileBottomNav.css`

**Interfaces:**
- Consumes: the 6px buyer-surface standard.
- Produces: rounded interactive overlays and panels while preserving the live/video full-screen canvas.

- [ ] **Step 1: Capture the failing visual baseline**

Inspect the live and video routes before the change. Identify a non-media control or overlay whose computed radius is `0px`.

- [ ] **Step 2: Apply selector-level radius changes**

Use `var(--radius-md)` for interactive controls, action bars, snackbars, dialogs, cards, inputs, and preview tiles. Keep the stream/video viewport and thin progress line square; keep avatars/status dots circular and short functional tags pill-shaped.

- [ ] **Step 3: Verify the engagement behavior**

At mobile width, confirm live/video controls have 6px corners while the full-screen media remains edge-to-edge and the bottom navigation remains a full-width edge.

### Task 4: Re-audit and release

**Files:**
- Modify: `docs/superpowers/specs/2026-08-22-buyer-radius-standard.md` only if the audit reveals a necessary clarification.

**Interfaces:**
- Consumes: completed buyer CSS updates.
- Produces: verified source and a clear list of intentional remaining sharp selectors.

- [ ] **Step 1: Re-audit remaining sharp declarations**

Run:

```bash
rg -n 'border-radius:\\s*0(?:px)?' src --glob '*.css'
```

Check every remaining buyer-facing result against the allowed exceptions; Seller Centre may remain outside scope.

- [ ] **Step 2: Run automated checks**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and Vite production build completes.

- [ ] **Step 3: Perform responsive visual checks**

Inspect `/th`, `/th/product/<existing-product-id>`, `/th/checkout`, `/th/live`, and `/th/video` at 1440px and 390px where applicable. Confirm rounded discrete surfaces, preserved circles/pills, and no overflow/regression.

- [ ] **Step 4: Commit and push**

```bash
git add src docs
git commit -m "style: standardize buyer surface corners"
git push origin codex/buyer-radius-standard
```
