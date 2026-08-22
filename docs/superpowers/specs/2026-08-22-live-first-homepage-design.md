# Live-first homepage redesign

## Purpose

Redesign the buyer homepage so that it visibly differs from the existing marketplace layout. The page should create live-commerce energy without weakening Movemall's approachable, trustworthy experience for higher-value purchases.

The desktop and mobile designs intentionally serve different behaviours:

- Desktop is a calm, efficient place to search, compare, and browse.
- Mobile is a discovery surface that makes people want to open a live room or short video, then continue into products.

## Scope

Change only the buyer homepage presentation and its responsive styling. Reuse the current routes, live stream list, product catalogue, category data, translations, interactions, and product links.

Do not add routes, APIs, new mock data, platform-wide authenticity guarantees, or checkout changes in this slice.

## Shared design language

- Keep the clean light palette: white surfaces, Movemall blue as the primary action colour, and red only for live status or time-sensitive deals.
- Use the established 6px card radius and restrained borders.
- Replace repeated decorative panels and badges with clearer spacing and headings.
- Use bounded trust copy such as "ร้านทางการ" and "คุ้มครองผู้ซื้อ". Do not claim that every product is authentic.

## Desktop layout (1200px and above)

1. Preserve the simplified primary navigation: Home, Shop, Mall, Stores. Live and Video remain direct destinations but are not peer primary links.
2. Place a `Live Edit` hero directly after the header. It uses the existing campaign content and CTA, but gains a more editorial composition: campaign message on the left and a compact live signal / live preview on the right.
3. Put a compact `กำลังไลฟ์ตอนนี้` rail under the hero. It shows existing rooms with a live status, viewer context, and current product cue. It is a browsing module, not a floating widget.
4. Follow with existing promotion, category, Mall/store, and product-feed content. Reduce duplicate headers and framing so the product feed is the dominant shopping area.
5. Keep the homepage product grid at five columns on wide desktop, while Shop retains its filter-oriented four-column grid.

## Mobile layout (up to 640px)

1. Retain the existing mobile bottom navigation order: Home, Live, Video, Cart, Account.
2. Put a full-width `Live-first` hero at the top of the homepage. It highlights one current stream using existing live data and provides one clear action to enter the live experience.
3. Place a horizontally scrollable rail of five live rooms below the hero. Each card uses existing room imagery/data, supports touch scrolling, and snaps into place.
4. Keep product discovery immediately after the live rail. Product cards stay in a two-column grid, so a single downward scroll reaches shoppable inventory.
5. Keep engagement surfaces visible through Live and Video bottom-nav destinations rather than adding them to desktop's primary navigation.

## Component and data boundaries

- Keep `HomePage.tsx` as the composition owner; do not duplicate the homepage or create a second data flow.
- Reuse `mockLiveStreams`, the existing product/filter state, translation keys, `ProductCard`, and localized routing helpers.
- Keep new layout-only styles in `HomePage.css` and preserve current breakpoint conventions.
- Extend locale catalog entries only when new visible labels are necessary. All Thai, English, and Myanmar catalogs must remain key-parallel.

## Accessibility and resilience

- Preserve semantic sections, existing accessible names for navigation, live cards, carousel controls, and product links.
- Keep keyboard access to every CTA and maintain visible focus styles.
- The live rail must remain usable with horizontal touch scrolling and without relying on hover.
- Existing image-error handling and fallback data paths remain in use.

## Validation

- Run `npm test`, including translation-catalog parity checks.
- Run `npm run build`.
- Verify the homepage at 1440px, 390px, and 320px using a local browser session:
  - desktop has simplified primary navigation and a five-column product grid;
  - mobile starts with the Live-first hero and has a horizontally scrollable live rail;
  - mobile product feed remains two columns with no bottom-nav overflow;
  - buyer-visible home and Mall copy contains no unsupported `ของแท้ 100%` platform claim.
