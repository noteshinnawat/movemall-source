# Buyer-facing corner-radius standard

## Purpose

Make buyer-facing UI surfaces feel consistent by using the existing 6px medium radius. This removes leftover sharp rectangular overrides without making the marketplace look excessively rounded.

## Scope

Apply the standard to buyer routes and their shared components:

- cards, tiles, product cards, offer panels, and empty states;
- buttons, form inputs, search fields, selectors, and controls;
- dialogs, popovers, dropdown panels, and mobile sheets;
- buyer navigation surfaces where they are visually separate containers.

The work covers the home, shop, product, cart, checkout, store, wishlist, order, notification, help, chat, flash sale, voucher, game, live, and video experiences. It does not change Seller Centre or Admin operational interfaces.

## Visual rules

- Default rectangular UI surface: `var(--radius-md)` (6px).
- Compact labels/tags that need to read as pills may keep a full pill radius.
- Avatars, profile images, status dots, and radio-like markers remain circular.
- Full-bleed video players, edge-to-edge screens, and intentionally square media frames remain square.
- Do not change layout dimensions, interaction behavior, copy, or data while normalizing corners.
- Prefer the existing design tokens rather than introducing another radius scale.

## Implementation approach

1. Update shared buyer component styles first, replacing legacy sharp `0` overrides and undersized surface radii with `var(--radius-md)` where the element is a card, control, input, popup, or dialog.
2. Audit each buyer-page stylesheet containing a zero-radius declaration. Change only elements that are discrete UI surfaces; retain documented functional exceptions such as full-screen media and circular affordances.
3. Leave pill badges and circular UI untouched, even when they occur alongside other radius changes in the same stylesheet.
4. Do not apply a blanket global replacement: selector intent determines the radius.

## Verification

- Run the existing frontend test suite and production build.
- Inspect representative desktop (1440px) and mobile (390px) pages: home, product or checkout, live, and video.
- Confirm cards and controls use 6px corners, while avatars, pills, and full-screen media retain their appropriate shapes.
- Re-audit remaining zero-radius declarations and confirm each is an intentional exception or outside the buyer-facing scope.
