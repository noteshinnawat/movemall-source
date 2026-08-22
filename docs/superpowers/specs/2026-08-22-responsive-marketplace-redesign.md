# Movemall Responsive Marketplace Redesign

**Status:** Approved design — implementation pending

## Goal

Retain Movemall's existing commerce capabilities while making desktop a calm, high-consideration shopping experience and mobile a discovery-led experience ready to evolve into a native app.

## Product principles

- Make premium and higher-value purchases easy to evaluate: clear search, price, seller identity, buyer protection, and checkout.
- Do not make a platform-wide claim that all goods are genuine. Surface verification only where a seller or item meets the required criteria.
- Use Live and short video as discovery and engagement surfaces, not as primary desktop navigation.
- Keep purchase completion simple: no more than three checkout steps and no repeated entry of known customer data.

## Desktop information architecture

### Navigation

Primary navigation is **Home**, **Shop**, **Mall**, and **Stores**. Search, notifications, chat, cart, and account remain immediately accessible. Seller Centre, help, and locale selection stay in a compact utility area.

Live, short video, games, vouchers, and flash-sale destinations are not peer primary-nav entries. They remain available through homepage modules, contextual links, and account/offer surfaces.

### Homepage hierarchy

1. Search and hero message
2. Buyer-protection message and verified-store discovery
3. Official/verified brands and curated selections
4. Product feed
5. Promotion, Live, and short-video modules below the primary shopping feed

Remove desktop visual noise that competes with purchase decisions: the live activity ticker, floating live widget, and redundant quick-access treatments. Existing routes and business functions remain available.

### Product density

Use five product cards per row for a wide desktop homepage feed. With the current 1240px content container this leaves approximately 235px per card, sufficient for an image, seller/status context, readable price, and buyer-perk information.

Responsive targets:

| Viewport/context | Product grid |
| --- | --- |
| Wide desktop home | 5 columns |
| Desktop shop with filters | 4 columns |
| Laptop/tablet landscape | 3–4 columns |
| Mobile | 2 columns |

## Mobile information architecture

### Bottom navigation

The five persistent tabs are **Home**, **Live**, **Video**, **Cart**, and **Account**. Cart stays top-level because it is the conversion path; order history is housed in Account.

### Home feed

1. Search and concise hero
2. Buyer-protection / verified-store discovery message
3. Horizontal “Live now” rail (3–5 rooms) directly on Home
4. Video and discovery topics
5. Verified-store / official-brand discovery
6. Existing product feed in a two-column grid as the user scrolls

The Live tab remains a dedicated full-screen experience. The Home rail is an entry point, not a replacement for the live feed.

Mobile filtering uses a search-first flow and bottom sheet rather than a persistent desktop sidebar.

## Trust, verification, and reporting

- Platform-level wording: “Shop with confidence”, “Buyer protection”, and a visible route to report suspicious shops or products.
- Seller/item-level wording: “Verified official store” or equivalent only after the applicable verification process has completed.
- Do not use unqualified platform-wide wording such as “100% genuine”.
- Link any guarantee or reimbursement claim to its eligibility conditions.

## Authentication, address, checkout, and LINE

- Require login or phone verification before checkout.
- Checkout has three screens: **Cart → Address & payment → Confirm order**.
- Persist known addresses, delivery preferences, and payment choices for reuse.
- Address entry uses postcode or subdistrict search to populate district, province, and postcode; the customer only supplies house number and necessary detail.
- After a completed order, invite the customer to add the Movemall LINE account for updates. It is optional and has an equally clear “Not now” action. Core web/SMS notifications remain available for important order events.

## Component and implementation boundaries

- Keep shared product data and the existing `ProductCard` model; introduce presentation variants or responsive CSS instead of duplicating product logic.
- Keep `Navbar` desktop-focused and `MobileBottomNav` mobile-focused. Desktop-only floating/discovery elements need explicit responsive visibility rules.
- Build mobile filters as a dedicated bottom-sheet component that reuses existing filter state rather than creating a second filter model.
- Address assistance should be a reusable address-field component backed by a single location lookup source, with manual entry/error fallback.
- LINE connection remains optional and uses the existing connection flow; its placement moves to the order-success journey.

## Existing-code audit and safe removal

- Audit existing components, routes, styles, imports, and call sites before adding or deleting code. Prefer reuse and small responsive changes.
- Remove only code that has no active route, import, runtime reference, or agreed product purpose after the redesign.
- Treat a component as retained when it still supports a mobile discovery flow, checkout, buyer protection, account/order management, or an operational/seller/admin workflow, even if it leaves the desktop primary navigation.
- Make removals in small, independently verifiable changes. After each removal, run type checking/build and test the affected route or user flow.
- Do not delete APIs, data models, or backend routes solely because their desktop entry point is removed; remove them only after confirming no client, scheduled task, or operational workflow depends on them.

## Error and edge states

- If address lookup fails, preserve entered values and allow manual subdistrict/district/province/postcode input.
- If a saved address is incomplete or unavailable, select no address and request only the missing fields.
- If LINE connection is cancelled or fails, complete the order normally and retain the optional reconnect action.
- If a verification state is unavailable, omit the verification badge rather than implying a guarantee.

## Validation plan

- Responsive visual checks at wide desktop, laptop, tablet, and small mobile sizes.
- Verify card metadata remains readable at five desktop columns and two mobile columns.
- Test the full checkout path with a new user, saved address, manual-address fallback, and optional LINE skip/connect paths.
- Confirm Live/video appear in mobile bottom navigation and homepage discovery rails, but not desktop primary navigation.
- Verify no product or seller without the required status receives verified/guarantee copy.
