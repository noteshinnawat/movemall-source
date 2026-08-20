# Buyer Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้หน้าผู้ซื้อของ Movemall ใช้งานได้ครบในภาษาไทย อังกฤษ และพม่า โดยภาษาอยู่ใน URL และไม่มีข้อความระบบผิดภาษาหลงเหลือ

**Architecture:** ใช้ `i18next` และ `react-i18next` โหลดคำแปลแบบ namespace จาก `public/locales` โดยมีภาษาไทยเป็นภาษาสำรอง URL เป็นแหล่งข้อมูลหลักของภาษาปัจจุบันผ่าน `LocaleBoundary`; เส้นทางผู้ซื้อมี `/:locale` นำหน้า ส่วน Seller, Admin, Affiliate และ Creator ยังคงเส้นทางเดิมและภาษาไทย

**Tech Stack:** React 19, React Router 7, TypeScript 6, Vite 8, i18next, react-i18next, i18next-http-backend, Vanilla CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-08-20-buyer-localization-design.md`

## Global Constraints

- ภาษาที่รองรับมีค่าแน่นอนเป็น `th`, `en`, `my`; ภาษาเริ่มต้นและภาษาสำรองคือ `th`
- หน้าผู้ซื้อแสดงข้อความระบบเพียงภาษาเดียว ยกเว้นชื่อแบรนด์ รุ่นสินค้า และเนื้อหาที่ร้านค้าหรือผู้ใช้สร้าง
- ชื่อร้าน ชื่อสินค้า รายละเอียดสินค้า รีวิว แชต และคำบรรยายวิดีโอคงภาษาต้นฉบับ
- สกุลเงินยังเป็น THB และใช้เลขอารบิกทั้งสามภาษา
- เส้นทาง `/seller`, `/admin`, `/seller/register`, `/affiliate`, `/creator/studio`, `/video/create` ไม่แปลในระยะนี้
- ใช้ Vanilla CSS เท่านั้น และใช้ `border-radius: 6px` ยกเว้นอวตารวงกลม
- URL ผู้ซื้อเดิมที่ไม่มี locale ส่งต่อไปภาษาไทย ยกเว้น `/` ซึ่งใช้ภาษาล่าสุดและใช้ไทยเมื่อยังไม่เคยเลือก
- ทุก task ต้องเพิ่มคีย์ `th`, `en`, `my` พร้อมกัน และผ่าน parity check ก่อน commit
- ห้ามแปลหรือต่อประโยคด้วย string concatenation; ใช้ interpolation ของ i18next
- ไม่เพิ่ม SSR, ระบบแปลอัตโนมัติ หรือบริการจัดการคำแปลภายนอก

---

## File Map

### แกนระบบใหม่

- `src/i18n/config.ts`: สร้างและตั้งค่า i18next instance
- `src/i18n/locales.ts`: ชนิด locale, การอ่าน/เขียน URL และการเลือกภาษาเริ่มต้น
- `src/i18n/formatters.ts`: รูปแบบราคา ตัวเลข วันที่ และเวลา
- `src/i18n/errorMessages.ts`: แปลง API error code เป็น translation key
- `src/i18n/LocaleBoundary.tsx`: ซิงค์ locale ใน URL กับ i18next, `<html lang>` และ localStorage
- `src/i18n/LocalizedLink.tsx`: ลิงก์และ hook สำหรับสร้างเส้นทางภาษาปัจจุบัน
- `src/i18n/LegacyBuyerRedirect.tsx`: ส่ง URL ผู้ซื้อเดิมไปภาษาไทยโดยรักษา query/hash
- `src/i18n/BuyerSeo.tsx`: จัดการข้อมูลกำกับสำหรับเส้นทางผู้ซื้อที่ไม่ใช่หน้าสินค้า
- `src/components/LanguageSwitcher.tsx`: ตัวเลือกภาษาเดสก์ท็อปและมือถือ
- `src/components/LanguageSwitcher.css`: รูปแบบตัวเลือกภาษาและสถานะโฟกัส
- `public/locales/{th,en,my}/*.json`: คำแปล 7 namespaces ตาม spec
- `scripts/check-locales.mjs`: ตรวจ parity, ค่าว่าง และข้อความตกค้างใน buyer source
- `docs/localization/glossary.md`: คำศัพท์มาตรฐานไทย อังกฤษ และพม่า

### ไฟล์หลักที่ต้องแก้

- `package.json`, `package-lock.json`, `src/main.tsx`, `src/App.tsx`, `src/uiCopy.ts`
- `src/utils/seo.ts`, `src/utils/lineAuth.ts`, `src/styles/base.css`, `index.html`
- `public/sw.js`, `public/sitemap.xml`, `public/robots.txt`
- `public/manifest.th.json`, `public/manifest.en.json`, `public/manifest.my.json`
- คอมโพเนนต์และหน้าผู้ซื้อที่แจกแจงใน Task 4–8

### การทดสอบใหม่

- `tests/locales.test.mjs`: locale URL utilities และ formatters
- `tests/translation-catalogs.test.mjs`: parity และค่าว่างของ JSON
- `tests/seo-localization.test.mjs`: Canonical, alternate และ JSON-LD แบบ locale-aware
- `tests/error-messages.test.mjs`: API error code mapping
- `tests/buyer-copy-audit.test.mjs`: เรียก source audit และยืนยันว่าไม่มีข้อความระบบตกค้าง

---

### Task 1: Locale primitives and localized formatters

**Files:**
- Create: `src/i18n/locales.ts`
- Create: `src/i18n/formatters.ts`
- Create: `tests/locales.test.mjs`

**Interfaces:**
- Produces: `Locale`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `LOCALE_STORAGE_KEY`, `isLocale`, `localeFromPath`, `stripLocale`, `withLocale`, `replaceLocale`, `resolveRootLocale`, `formatCurrency`, `formatNumber`, `formatDate`, `formatTime`

- [ ] **Step 1: Write failing locale tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localeFromPath, stripLocale, withLocale, replaceLocale, resolveRootLocale,
} from '../src/i18n/locales.ts';
import { formatCurrency, formatNumber } from '../src/i18n/formatters.ts';

test('reads and removes supported locale prefixes', () => {
  assert.equal(localeFromPath('/my/shop?q=shoe'), 'my');
  assert.equal(localeFromPath('/jp/shop'), null);
  assert.equal(stripLocale('/en/product/abc-i.1'), '/product/abc-i.1');
});

test('adds and replaces locale without losing search or hash', () => {
  assert.equal(withLocale('/shop?q=shoe#filters', 'en'), '/en/shop?q=shoe#filters');
  assert.equal(replaceLocale('/th/shop?q=shoe#filters', 'my'), '/my/shop?q=shoe#filters');
});

test('root locale uses saved supported value and otherwise Thai', () => {
  assert.equal(resolveRootLocale('en'), 'en');
  assert.equal(resolveRootLocale('jp'), 'th');
  assert.equal(resolveRootLocale(null), 'th');
});

test('formats THB and counts with the selected locale', () => {
  assert.match(formatCurrency(1500, 'th'), /1,500/);
  assert.match(formatCurrency(1500, 'en'), /1,500/);
  assert.equal(formatNumber(12500, 'en'), '12,500');
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test tests/locales.test.mjs`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/i18n/locales.ts`.

- [ ] **Step 3: Implement exact locale contracts**

```ts
export const SUPPORTED_LOCALES = ['th', 'en', 'my'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'th';
export const LOCALE_STORAGE_KEY = 'movemall_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale | null {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : null;
}

export function stripLocale(path: string): string {
  const [, pathname = '/', suffix = ''] = path.match(/^([^?#]*)(.*)$/u) ?? [];
  const locale = localeFromPath(pathname);
  const bare = locale ? pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/' : pathname;
  return `${bare}${suffix}`;
}

export function withLocale(path: string, locale: Locale): string {
  const bare = stripLocale(path);
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}

export const replaceLocale = withLocale;
export function resolveRootLocale(value: string | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
```

Implement formatters with `Intl.NumberFormat`/`Intl.DateTimeFormat` and the map `{ th: 'th-TH', en: 'en-US', my: 'my-MM' }`; set `currency: 'THB'` and `numberingSystem: 'latn'` for all locales.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/locales.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales.ts src/i18n/formatters.ts tests/locales.test.mjs
git commit -m "feat: add locale and formatting primitives"
```

---

### Task 2: i18next runtime and translation catalog validation

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/main.tsx`
- Create: `src/i18n/config.ts`
- Create: `public/locales/{th,en,my}/{common,navigation,auth,catalog,commerce,engagement,legal}.json`
- Create: `scripts/check-locales.mjs`
- Create: `tests/translation-catalogs.test.mjs`
- Create: `docs/localization/glossary.md`

**Interfaces:**
- Consumes: locale constants from Task 1
- Produces: default `i18n` instance, seven complete namespaces, command `npm run check:locales`

- [ ] **Step 1: Install runtime packages**

Run: `npm install i18next react-i18next i18next-http-backend`  
Expected: `package.json` and `package-lock.json` contain all three direct dependencies.

- [ ] **Step 2: Write failing catalog tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const languages = ['th', 'en', 'my'];
const namespaces = ['common', 'navigation', 'auth', 'catalog', 'commerce', 'engagement', 'legal'];
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flatten(child, path) : [[path, child]];
});

test('translation catalogs have identical non-empty keys', async () => {
  for (const namespace of namespaces) {
    const catalogs = Object.fromEntries(await Promise.all(languages.map(async language => [
      language,
      JSON.parse(await readFile(`public/locales/${language}/${namespace}.json`, 'utf8')),
    ])));
    const thaiKeys = flatten(catalogs.th).map(([key]) => key).sort();
    for (const language of languages) {
      const entries = flatten(catalogs[language]);
      assert.deepEqual(entries.map(([key]) => key).sort(), thaiKeys, `${language}/${namespace}`);
      assert.ok(entries.every(([, value]) => typeof value !== 'string' || value.trim().length > 0));
    }
  }
});
```

- [ ] **Step 3: Run catalog test and confirm failure**

Run: `node --test tests/translation-catalogs.test.mjs`  
Expected: FAIL because locale JSON files do not exist.

- [ ] **Step 4: Add catalogs and initialize i18next**

Start `common.json` with the exact shared values below; create the other six namespaces as `{}` in all languages. Later tasks extend the relevant namespace in all three files together.

`public/locales/th/common.json`:
```json
{
  "loading": "กำลังโหลด...",
  "actions": { "close": "ปิด", "back": "ย้อนกลับ", "continue": "ดำเนินการต่อ", "retry": "ลองอีกครั้ง" },
  "errors": { "generic": "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง", "notFound": "ไม่พบหน้าที่ต้องการ" }
}
```

`public/locales/en/common.json`:
```json
{
  "loading": "Loading...",
  "actions": { "close": "Close", "back": "Back", "continue": "Continue", "retry": "Try again" },
  "errors": { "generic": "Something went wrong. Please try again.", "notFound": "The page you requested was not found." }
}
```

`public/locales/my/common.json`:
```json
{
  "loading": "တင်နေသည်...",
  "actions": { "close": "ပိတ်ရန်", "back": "နောက်သို့", "continue": "ဆက်လက်လုပ်ဆောင်ရန်", "retry": "ထပ်မံကြိုးစားရန်" },
  "errors": { "generic": "အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်။ ထပ်မံကြိုးစားပါ။", "notFound": "သင်ရှာနေသော စာမျက်နှာကို မတွေ့ပါ။" }
}
```

Configure `src/i18n/config.ts` with `HttpBackend`, `initReactI18next`, `supportedLngs`, `fallbackLng: 'th'`, all seven namespaces, `defaultNS: 'common'`, `returnEmptyString: false`, `maxRetries: 1`, `retryTimeout: 250`, `parseMissingKeyHandler: () => 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'`, `interpolation.escapeValue: false`, and `backend.loadPath: '/locales/{{lng}}/{{ns}}.json'`. Import this file once in `src/main.tsx` before rendering `<App />`.

Create `docs/localization/glossary.md` with one canonical row per shared commerce term. Seed it with: `หน้าหลัก | Home | ပင်မ`, `สินค้า | Products | ကုန်ပစ္စည်းများ`, `ร้านค้า | Stores | ဆိုင်များ`, `ตะกร้า | Cart | ဈေးခြင်းတောင်း`, `ชำระเงิน | Checkout | ငွေရှင်းမည်`, `คำสั่งซื้อ | Orders | မှာယူမှုများ`, `บัญชี | Account | အကောင့်`, `รายการโปรด | Wishlist | စိတ်ကြိုက်စာရင်း`, `ไลฟ์สด | Live | တိုက်ရိုက်`, `คูปอง | Voucher | ဘောက်ချာ`, `ส่งฟรี | Free shipping | ပို့ဆောင်ခအခမဲ့`, `คืนสินค้า | Return item | ကုန်ပစ္စည်းပြန်ပို့ရန်`; keep `Movemall`, `Mall`, PromptPay and provider/brand names unchanged.

Create `scripts/check-locales.mjs` from the same deep-flatten logic, exit code `1` on a missing/extra/empty key, and add `"check:locales": "node scripts/check-locales.mjs"` before `check` in `package.json`. Change `check` to run `check:locales`, lint, frontend build, tests, and backend build.

- [ ] **Step 5: Verify runtime and catalogs**

Run: `npm run check:locales && node --test tests/translation-catalogs.test.mjs && npm run build`  
Expected: all commands PASS and Vite resolves the i18next imports.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/main.tsx src/i18n/config.ts public/locales scripts/check-locales.mjs tests/translation-catalogs.test.mjs docs/localization/glossary.md
git commit -m "feat: initialize buyer translation catalogs"
```

---

### Task 3: Locale-aware routing and navigation primitives

**Files:**
- Create: `src/i18n/LocaleBoundary.tsx`
- Create: `src/i18n/LocalizedLink.tsx`
- Create: `src/i18n/LegacyBuyerRedirect.tsx`
- Modify: `src/i18n/locales.ts`, `src/App.tsx`, `tests/locales.test.mjs`

**Interfaces:**
- Consumes: `Locale`, `localeFromPath`, `withLocale`, `resolveRootLocale`; i18next instance
- Produces: `<LocaleBoundary>`, `<LocalizedLink>`, `useLocalizedPath()`, `<LegacyBuyerRedirect>`, `isBuyerLegacyPath(path: string): boolean`, `legacyRedirectTarget(path: string, savedLocale: string | null): string | null`, localized buyer route table

- [ ] **Step 1: Add failing tests for redirect contracts**

Add these assertions to `tests/locales.test.mjs`:

```js
import { isBuyerLegacyPath, legacyRedirectTarget } from '../src/i18n/locales.ts';

test('legacy buyer routes redirect to Thai without changing URL state', () => {
  assert.equal(legacyRedirectTarget('/shop?q=phone#top', null), '/th/shop?q=phone#top');
  assert.equal(legacyRedirectTarget('/', 'my'), '/my');
  assert.equal(legacyRedirectTarget('/jp/shop', null), null);
});

test('operational routes never enter buyer localization', () => {
  for (const path of ['/seller', '/admin', '/affiliate', '/creator/studio', '/video/create']) {
    assert.equal(isBuyerLegacyPath(path), false);
  }
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test tests/locales.test.mjs`  
Expected: FAIL because buyer/operational route classification functions are not implemented.

- [ ] **Step 3: Implement boundary and link contracts**

`LocaleBoundary` must use `useLocation`, validate the first segment, call `i18n.changeLanguage(locale)`, set `document.documentElement.lang`, save `LOCALE_STORAGE_KEY`, and render a localized 404 for invalid locale prefixes. URL always wins over stored language.

`useLocalizedPath()` returns `(to: string) => string`; it prefixes buyer destinations with the current locale and returns operational destinations unchanged. `LocalizedLink` wraps React Router `Link` and calls this function.

`LegacyBuyerRedirect` reads pathname/search/hash, maps `/` to `resolveRootLocale(localStorage.getItem(LOCALE_STORAGE_KEY))`, maps every old buyer route to `th`, and uses `<Navigate replace>`.

- [ ] **Step 4: Convert route declarations**

In `src/App.tsx`, keep excluded operational routes unprefixed and declared before buyer routes. Prefix every included buyer route with `/:locale`, including `/auth/line/callback`. Add explicit legacy routes for all included buyer paths and a final localized 404. Replace path classification checks with `stripLocale(location.pathname)` so Navbar/Footer/floating-widget visibility remains unchanged.

Do not prefix these route declarations:

```ts
['/seller', '/seller/register', '/admin', '/affiliate', '/creator/studio', '/video/create']
```

- [ ] **Step 5: Verify routing**

Run: `node --test tests/locales.test.mjs && npm run build`  
Expected: PASS; TypeScript reports no invalid route props.

Manually verify with dev server: `/shop?q=x` redirects to `/th/shop?q=x`, `/en/shop` stays English locale, `/jp/shop` shows localized-route 404, and `/seller` remains unprefixed.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/LocaleBoundary.tsx src/i18n/LocalizedLink.tsx src/i18n/LegacyBuyerRedirect.tsx src/i18n/locales.ts src/App.tsx tests/locales.test.mjs
git commit -m "feat: add locale-aware buyer routes"
```

---

### Task 4: Shared buyer shell and language switcher

**Files:**
- Create: `src/components/LanguageSwitcher.tsx`, `src/components/LanguageSwitcher.css`
- Modify: `src/components/Navbar.tsx`, `Navbar.css`, `Footer.tsx`, `MobileBottomNav.tsx`, `CookieConsentBanner.tsx`, `PWAInstallPrompt.tsx`, `VisualSearchModal.tsx`, `ErrorBoundary.tsx`, `BackToTopButton.tsx`, `SkeletonCard.tsx`, `Toast.tsx`
- Modify: `public/locales/{th,en,my}/common.json`, `navigation.json`

**Interfaces:**
- Consumes: `useTranslation`, `useLocalizedPath`, current locale from i18next
- Produces: accessible `<LanguageSwitcher />`; shared shell free of hard-coded system copy

- [ ] **Step 1: Add navigation/common keys in all three languages**

Use these key families exactly: `navigation.primary.*`, `navigation.account.*`, `navigation.footer.*`, `navigation.language.*`, `common.cookie.*`, `common.pwa.*`, `common.visualSearch.*`, `common.toast.*`, `common.accessibility.*`. Preserve `Movemall`, brand names, PromptPay and social-network names as proper nouns; translate surrounding phrases.

- [ ] **Step 2: Implement the switcher accessibly**

```tsx
const OPTIONS = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
  { code: 'my', label: 'မြန်မာ' },
] as const;

function chooseLanguage(locale: Locale) {
  const next = replaceLocale(`${location.pathname}${location.search}${location.hash}`, locale);
  void i18n.changeLanguage(locale);
  navigate(next);
  requestAnimationFrame(() => triggerRef.current?.focus());
}
```

The trigger uses `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls`; options use `role="menuitemradio"`, `aria-checked`, and `aria-current="true"` on the current language. Close on selection, Escape, and outside pointer. Do not render on excluded operational routes.

- [ ] **Step 3: Replace shared links and copy**

Replace buyer-facing `Link` targets and `navigate()` calls with `LocalizedLink`/`useLocalizedPath`. Leave seller/admin/affiliate/creator destinations unprefixed. Move array constants such as footer columns and trending search placeholders inside the component or derive them from `t` so they update immediately on language change.

- [ ] **Step 4: Verify catalogs and shared shell**

Run: `npm run check:locales && npm run build`  
Expected: PASS.

Manual keyboard check: Tab to language trigger, open it, move to each choice, select Myanmar, confirm focus returns to the trigger and the URL/path/query/hash are preserved.

- [ ] **Step 5: Commit**

```bash
git add src/components/LanguageSwitcher.* src/components/Navbar.* src/components/Footer.tsx src/components/MobileBottomNav.tsx src/components/CookieConsentBanner.tsx src/components/PWAInstallPrompt.tsx src/components/VisualSearchModal.tsx src/components/ErrorBoundary.tsx src/components/BackToTopButton.tsx src/components/SkeletonCard.tsx src/components/Toast.tsx public/locales
git commit -m "feat: localize shared buyer shell"
```

---

### Task 5: Catalog discovery and product experience

**Files:**
- Modify: `src/pages/HomePage.tsx`, `ShopPage.tsx`, `BrandMallPage.tsx`, `ProductDetailPage.tsx`, `StorePage.tsx`, `StoresDirectoryPage.tsx`
- Modify: `src/components/ProductCard.tsx`, `FilterSidebar.tsx`, `ReviewsSection.tsx`, `ReportStoreModal.tsx`, `LiveStreamCard.tsx`
- Modify: `public/locales/{th,en,my}/catalog.json`, `common.json`

**Interfaces:**
- Consumes: `t('catalog:...')`, localized links, formatters
- Produces: localized discovery-to-product flow; unchanged product/store/review source content

- [ ] **Step 1: Add catalog keys**

Use page-oriented families: `catalog.home.*`, `catalog.shop.*`, `catalog.mall.*`, `catalog.product.*`, `catalog.store.*`, `catalog.storesDirectory.*`, `catalog.filters.*`, `catalog.reviews.*`, `catalog.reporting.*`. Use interpolation for counts, discount percentages, stock, followers and delivery thresholds. Product/store names, descriptions, variants supplied by data, review comments and live titles remain unwrapped.

- [ ] **Step 2: Migrate page copy and links**

For each listed page, instantiate `useTranslation(['catalog', 'common'])`, replace system literals in headings, buttons, tabs, placeholders, empty states, alerts, `title`, `aria-label`, badges and toasts. Replace direct `to="/…"` and `navigate('/…')` for buyer routes. Replace `.toLocaleString()` used for money/count UI with `formatCurrency`/`formatNumber` and current locale.

Product options currently containing bilingual labels such as `สีดำ (Classic Black)` must become locale-keyed option labels because they are demo system data embedded in the page; real API variants remain source content.

- [ ] **Step 3: Run focused verification**

Run: `npm run check:locales && npm run build`  
Expected: PASS.

Manual flow in each locale: home → search/filter → product → store; confirm product/store/review text remains original while controls change language.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/ShopPage.tsx src/pages/BrandMallPage.tsx src/pages/ProductDetailPage.tsx src/pages/StorePage.tsx src/pages/StoresDirectoryPage.tsx src/components/ProductCard.tsx src/components/FilterSidebar.tsx src/components/ReviewsSection.tsx src/components/ReportStoreModal.tsx src/components/LiveStreamCard.tsx public/locales
git commit -m "feat: localize buyer catalog experience"
```

---

### Task 6: Cart, checkout and order lifecycle

**Files:**
- Modify: `src/pages/CartPage.tsx`, `CheckoutPage.tsx`, `OrderSuccessPage.tsx`, `OrdersPage.tsx`, `WishlistPage.tsx`, `ComparePage.tsx`, `TrackingPage.tsx`
- Modify: `src/components/CartItem.tsx`, `PromptPayModal.tsx`, `LineConnectModal.tsx`
- Modify: `src/uiCopy.ts`, `src/App.tsx`
- Modify: `public/locales/{th,en,my}/commerce.json`, `common.json`

**Interfaces:**
- Consumes: locale formatters, `t`, localized navigation
- Produces: localized purchase flow without changing cart/order/payment state

- [ ] **Step 1: Add commerce keys**

Use `commerce.cart.*`, `commerce.checkout.*`, `commerce.payment.*`, `commerce.orderSuccess.*`, `commerce.orders.*`, `commerce.wishlist.*`, `commerce.compare.*`, `commerce.tracking.*`. Keep payment provider names and courier brand names unchanged; translate payment-method descriptions, order statuses and timeline labels. Interpolate amounts, quantities, order IDs and dates.

- [ ] **Step 2: Replace transaction copy without moving state**

Only replace display strings and links. Do not move or reset React state, cart hooks, payment timers, PromptPay polling, checkout form values or order payload fields. Convert `UI_COPY` from static Thai values to functions receiving `TFunction`, for example:

```ts
export const uiCopy = {
  cartAdded: (t: TFunction, quantity: number) => t('common:toast.cartAdded', { count: quantity }),
  wishlistAdded: (t: TFunction) => t('common:toast.wishlistAdded'),
};
```

In `App.tsx`, obtain `t` through `useTranslation` inside the rendered app component so switching language rerenders action callbacks. Keep seller/product-management toast messages Thai because those routes are out of scope.

- [ ] **Step 3: Verify purchase invariants**

Run: `npm run check:locales && npm run build && npm test`  
Expected: PASS.

Manual check: add two products, change language on cart and checkout, confirm quantities, address fields, payment choice, coins and total do not reset; complete a mock order and confirm localized success/tracking links.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CartPage.tsx src/pages/CheckoutPage.tsx src/pages/OrderSuccessPage.tsx src/pages/OrdersPage.tsx src/pages/WishlistPage.tsx src/pages/ComparePage.tsx src/pages/TrackingPage.tsx src/components/CartItem.tsx src/components/PromptPayModal.tsx src/components/LineConnectModal.tsx src/uiCopy.ts src/App.tsx public/locales
git commit -m "feat: localize buyer purchase flow"
```

---

### Task 7: Authentication, account, chat and notifications

**Files:**
- Modify: `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `AccountPage.tsx`, `LineCallbackPage.tsx`, `ChatPage.tsx`, `NotificationsPage.tsx`
- Modify: `src/components/ProtectedRoute.tsx`, `TurnstileWidget.tsx`
- Modify: `src/utils/lineAuth.ts`
- Modify: `public/locales/{th,en,my}/auth.json`, `engagement.json`, `common.json`

**Interfaces:**
- Consumes: localized navigation and `t`
- Produces: localized identity/messaging UI; OAuth callback preserves locale

- [ ] **Step 1: Add auth and communication keys**

Use `auth.login.*`, `auth.register.*`, `auth.account.*`, `auth.oauth.*`, `auth.validation.*`, `engagement.chat.*`, `engagement.notifications.*`, `common.protectedRoute.*`. Keep user names, store names, chat messages, notification payload content and OAuth provider names unchanged; translate surrounding labels and system-generated quick replies.

- [ ] **Step 2: Localize forms without resetting them**

Use translation keys for labels, placeholders, validation messages, consent copy, OTP timers, password-strength labels, empty/loading states, quick questions and accessibility attributes. Language changes must not alter controlled form state or current chat room.

Update LINE OAuth redirect construction to include the active locale. Keep `/auth/line/callback` as a legacy callback that redirects to `/th/auth/line/callback`; add all three localized callback URLs to the deployment checklist because LINE Console must allow them before release.

- [ ] **Step 3: Preserve source content in chat/notifications**

Translate only UI and system templates. Values from API fields such as `message.text`, `storeName`, `notification.title` and `notification.message` remain unchanged. Translate known notification `type`/status badges independently.

- [ ] **Step 4: Verify account flows**

Run: `npm run check:locales && node --test tests/googleAuth.test.mjs && npm run build`  
Expected: PASS. Google authentication behavior remains unchanged in this task; Task 9 changes its error contract and test expectations.

Manual check: login validation, register/OTP, account tabs, protected-route redirect, chat room persistence and notification filters in all three locales.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/RegisterPage.tsx src/pages/AccountPage.tsx src/pages/LineCallbackPage.tsx src/pages/ChatPage.tsx src/pages/NotificationsPage.tsx src/components/ProtectedRoute.tsx src/components/TurnstileWidget.tsx src/utils/lineAuth.ts public/locales
git commit -m "feat: localize buyer account and messaging"
```

---

### Task 8: Live, video, promotions, help and legal pages

**Files:**
- Modify: `src/pages/LiveStreamPage.tsx`, `VideoFeedPage.tsx`, `GamesPage.tsx`, `FlashSalePage.tsx`, `VouchersPage.tsx`, `HelpCenterPage.tsx`, `PrivacyPolicyPage.tsx`, `TermsPage.tsx`
- Modify: `src/components/FloatingLiveWidget.tsx`, `LiveActivityTicker.tsx`, `VideoClipInGridCard.tsx`, `YellowBasketModal.tsx`
- Modify: `public/locales/{th,en,my}/engagement.json`, `legal.json`, `common.json`

**Interfaces:**
- Consumes: `t`, localized links, formatters
- Produces: localized engagement/promotional/legal surfaces; creator content untouched

- [ ] **Step 1: Add engagement and legal keys**

Use `engagement.live.*`, `engagement.video.*`, `engagement.games.*`, `engagement.flashSale.*`, `engagement.vouchers.*`, `legal.help.*`, `legal.privacy.*`, `legal.terms.*`. Translate complete legal paragraphs as complete values, not sentence fragments. Preserve streamer names, video captions, hashtags, sounds, user comments and pinned-product data.

- [ ] **Step 2: Replace UI literals and timers**

Translate controls, reactions, basket actions, comment sheet labels, sharing feedback, game rules/rewards, countdown units, voucher conditions, help navigation and legal headings/body. Use plural/count interpolation and locale formatters. Keep `/video/create` and `/creator/studio` links operational and unprefixed.

- [ ] **Step 3: Verify media behavior**

Run: `npm run check:locales && npm run build`  
Expected: PASS.

Manual check in all locales: vertical live/video navigation, comment modal, yellow basket, game reward, countdown, voucher claim, help tabs and legal pages. Confirm media playback and active slide do not reset when changing language.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LiveStreamPage.tsx src/pages/VideoFeedPage.tsx src/pages/GamesPage.tsx src/pages/FlashSalePage.tsx src/pages/VouchersPage.tsx src/pages/HelpCenterPage.tsx src/pages/PrivacyPolicyPage.tsx src/pages/TermsPage.tsx src/components/FloatingLiveWidget.tsx src/components/LiveActivityTicker.tsx src/components/VideoClipInGridCard.tsx src/components/YellowBasketModal.tsx public/locales
git commit -m "feat: localize buyer engagement and legal pages"
```

---

### Task 9: Stable API error codes and localized fallback messages

**Files:**
- Create: `src/i18n/errorMessages.ts`, `tests/error-messages.test.mjs`
- Modify: `src/utils/api.ts`, `src/utils/googleAuth.ts`
- Modify: `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `AccountPage.tsx`, `CheckoutPage.tsx`, `OrdersPage.tsx`, `ChatPage.tsx`, `NotificationsPage.tsx`, `TrackingPage.tsx`, `ProductDetailPage.tsx`
- Modify: `server/src/routes/auth.routes.ts`, `user.routes.ts`, `product.routes.ts`, `store.routes.ts`, `order.routes.ts`, `payment.routes.ts`, `chat.routes.ts`, `notification.routes.ts`, `logistics.routes.ts`
- Modify: `tests/googleAuth.test.mjs`
- Modify: `public/locales/{th,en,my}/common.json`

**Interfaces:**
- Produces: `errorTranslationKey(code: unknown): string`, API errors shaped as `{ code: string; message?: string }`

- [ ] **Step 1: Write failing mapping tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { errorTranslationKey } from '../src/i18n/errorMessages.ts';

test('maps known codes and hides unknown server copy', () => {
  assert.equal(errorTranslationKey('AUTH_INVALID_CREDENTIALS'), 'errors.authInvalidCredentials');
  assert.equal(errorTranslationKey('ORDER_OUT_OF_STOCK'), 'errors.orderOutOfStock');
  assert.equal(errorTranslationKey('anything-else'), 'errors.generic');
  assert.equal(errorTranslationKey(null), 'errors.generic');
});
```

- [ ] **Step 2: Implement the explicit code map**

Support at minimum: `AUTH_INVALID_CREDENTIALS`, `AUTH_REQUIRED`, `OTP_INVALID`, `OTP_EXPIRED`, `PRODUCT_NOT_FOUND`, `ORDER_OUT_OF_STOCK`, `ORDER_FAILED`, `PAYMENT_FAILED`, `NETWORK_ERROR`, `RATE_LIMITED`. Unknown/missing codes return `errors.generic`. Never use arbitrary server `message` as rendered copy; keep it for `console.warn` outside production.

- [ ] **Step 3: Add codes to buyer-facing API responses**

Audit auth, user, product, store, order, payment, chat, notification and logistics routes. Add stable `code` alongside the existing message without removing fields, so old clients remain compatible. Do not modify seller/admin-only behavior beyond shared authentication responses.

- [ ] **Step 4: Verify frontend and backend contracts**

Run: `node --test tests/error-messages.test.mjs && npm run build && npm --prefix server run build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/errorMessages.ts tests/error-messages.test.mjs tests/googleAuth.test.mjs src/utils/api.ts src/utils/googleAuth.ts src/pages/LoginPage.tsx src/pages/RegisterPage.tsx src/pages/AccountPage.tsx src/pages/CheckoutPage.tsx src/pages/OrdersPage.tsx src/pages/ChatPage.tsx src/pages/NotificationsPage.tsx src/pages/TrackingPage.tsx src/pages/ProductDetailPage.tsx public/locales server/src/routes/auth.routes.ts server/src/routes/user.routes.ts server/src/routes/product.routes.ts server/src/routes/store.routes.ts server/src/routes/order.routes.ts server/src/routes/payment.routes.ts server/src/routes/chat.routes.ts server/src/routes/notification.routes.ts server/src/routes/logistics.routes.ts
git commit -m "feat: localize buyer API errors by code"
```

---

### Task 10: Localized SEO, sitemap, PWA and Myanmar typography

**Files:**
- Modify: `src/utils/seo.ts`, `src/App.tsx`, `index.html`, `src/styles/base.css`, `src/index.css`
- Create: `src/i18n/BuyerSeo.tsx`
- Create: `tests/seo-localization.test.mjs`
- Create: `public/manifest.th.json`, `public/manifest.en.json`, `public/manifest.my.json`
- Modify: `public/sw.js`, `public/sitemap.xml`, `public/robots.txt`
- Delete: `public/manifest.json` after all references move to locale manifests

**Interfaces:**
- Consumes: `Locale`, localized path utilities, `t`
- Produces: `buildProductSeo(product, locale, t, storeName?)`, `applySeoTags(model)`, `<BuyerSeo />`, locale manifests and alternate URLs

- [ ] **Step 1: Extract pure SEO model and write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProductSeo } from '../src/utils/seo.ts';

const product = {
  id: 'p-1', storeId: 's-1', name: 'Original Product', description: 'Original description',
  price: 1500, images: ['/product.webp'], category: 'electronics', rating: 5,
  reviewCount: 1, stock: 10, tags: [],
};
const fakeTranslator = (key, values = {}) => ({
  'catalog:seo.productTitle': `${values.name} | Movemall`,
  'catalog:seo.productDescription': values.description,
  'catalog:seo.home': 'Home',
  'catalog:seo.allProducts': 'All products',
}[key] ?? key);

test('builds locale canonical and alternates without translating product content', () => {
  const model = buildProductSeo(product, 'my', fakeTranslator, 'Original Store');
  assert.match(model.canonicalUrl, /\/my\/product\//);
  assert.deepEqual(Object.keys(model.alternates).sort(), ['en', 'my', 'th', 'x-default']);
  assert.equal(model.structuredData['@graph'][0].name, product.name);
  assert.equal(model.structuredData['@graph'][0].description.includes(product.description), true);
});
```

- [ ] **Step 2: Implement deterministic SEO ownership**

`buildProductSeo` returns title, description, canonical, alternates, Open Graph locale (`th_TH`, `en_US`, `my_MM`) and JSON-LD. `applySeoTags` updates one tag per key and removes all old `link[rel="alternate"]` before adding the four current entries. Extend `slugify` Unicode acceptance to include Myanmar `\u1000-\u109F` while retaining the product ID suffix.

Create `<BuyerSeo />` in the localized buyer shell. It maps `stripLocale(pathname)` to `catalog:seo.pages.*`, `commerce:seo.pages.*`, `engagement:seo.pages.*`, `auth:seo.pages.*` or `legal:seo.pages.*`, then calls `applySeoTags` for every non-product buyer route. Product detail continues to use `buildProductSeo`. Add matching title/description keys to all three locale catalogs and render no SEO changes on excluded operational routes.

- [ ] **Step 3: Localize PWA assets**

Create three manifests with localized `name`, `description`, `start_url` (`/th`, `/en`, `/my`) and shared `short_name: "Movemall"`. Change the active manifest link when locale changes. Bump service-worker cache to `movemall-cache-v5`; precache all three manifests and the `common`/`navigation` locale files, then use stale-while-revalidate for `/locales/` while retaining existing network-first navigation behavior.

- [ ] **Step 4: Update font and discovery metadata**

Import Noto Sans Myanmar alongside Inter and add it to the base font stack. Set `[lang="my"] body { line-height: 1.65; }` and ensure form controls inherit the stack. Update `sitemap.xml` to localized buyer URLs with `xhtml:link` alternates, remove excluded `/affiliate`, and use `https://movemall.app` consistently in Canonical, Open Graph, sitemap and OAuth callbacks.

- [ ] **Step 5: Verify SEO/PWA**

Run: `node --test tests/seo-localization.test.mjs && npm run check:locales && npm run build`  
Expected: PASS.

Manual browser check: switch language twice and confirm exactly one canonical, four alternate links, correct `<html lang>`, correct manifest URL, and no duplicate JSON-LD scripts.

- [ ] **Step 6: Commit**

```bash
git add src/utils/seo.ts src/i18n/BuyerSeo.tsx src/App.tsx tests/seo-localization.test.mjs index.html src/styles/base.css src/index.css public/manifest.*.json public/sw.js public/sitemap.xml public/robots.txt public/locales
git rm public/manifest.json
git commit -m "feat: localize buyer SEO and PWA metadata"
```

---

### Task 11: Buyer-copy audit, responsive QA and release gate

**Files:**
- Modify: `scripts/check-locales.mjs`, `package.json`
- Create: `tests/buyer-copy-audit.test.mjs`
- Modify: `src/components/Navbar.css`, `Footer.css`, `MobileBottomNav.css`, `LanguageSwitcher.css`
- Modify: `src/pages/HomePage.css`, `ShopPage.css`, `ProductDetailPage.css`, `CartPage.css`, `CheckoutPage.css`, `ChatPage.css`, `LiveStreamPage.css`, `VideoFeedPage.css`
- Modify: `docs/superpowers/specs/2026-08-20-buyer-localization-design.md` status line

**Interfaces:**
- Consumes: all catalogs and buyer source files
- Produces: reproducible source audit and release checklist

- [ ] **Step 1: Add failing source-audit test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBuyerSource } from '../scripts/check-locales.mjs';

test('buyer source contains no unapproved Thai UI literals', async () => {
  const violations = await auditBuyerSource();
  assert.deepEqual(violations, []);
});
```

The audit uses the TypeScript compiler API already present in dev dependencies and inspects `JsxText`, string literals used by visible JSX props, `alert`, toast calls and user-facing arrays. It ignores comments, translation JSON, mock product/store/review/video data and literals marked `/* i18n-allow-user-content */`. The buyer file allowlist is exactly the files changed in Tasks 4–8 plus buyer-facing portions of `App.tsx`.

- [ ] **Step 2: Run the audit and fix every reported literal**

Run: `node --test tests/buyer-copy-audit.test.mjs`  
Expected initially: FAIL listing file, line and literal. Move each system literal to the correct namespace; mark only genuine brand/user content with the permitted annotation. Rerun until PASS.

- [ ] **Step 3: Execute responsive and accessibility matrix**

Check widths 360, 390, 430, 1280 and 1440 in `th`, `en`, `my` for shared navigation and the critical flow `/shop` → product → cart → checkout → success. Fix only localized overflow: allow wrapping, replace fixed heights with `min-height`, use `min-width: 0`, and retain 6px radius. Verify visible focus, keyboard language menu, form labels and no clipped Myanmar marks.

- [ ] **Step 4: Run the complete release gate**

Run: `npm run check`  
Expected: `check:locales`, lint, frontend build, all Node tests and backend build all PASS with exit code 0.

Run: `git diff --check`  
Expected: no whitespace errors.

- [ ] **Step 5: Update design status and commit**

Change the design status to `ดำเนินการระยะแรกเสร็จสมบูรณ์และผ่าน release gate` only after Step 4 passes.

```bash
git add scripts/check-locales.mjs tests/buyer-copy-audit.test.mjs package.json package-lock.json src/components/Navbar.css src/components/Footer.css src/components/MobileBottomNav.css src/components/LanguageSwitcher.css src/pages/HomePage.css src/pages/ShopPage.css src/pages/ProductDetailPage.css src/pages/CartPage.css src/pages/CheckoutPage.css src/pages/ChatPage.css src/pages/LiveStreamPage.css src/pages/VideoFeedPage.css docs/superpowers/specs/2026-08-20-buyer-localization-design.md
git commit -m "test: enforce buyer localization completeness"
```

---

## Deployment Checklist

- เพิ่ม callback URLs `/th/auth/line/callback`, `/en/auth/line/callback`, `/my/auth/line/callback` ใน LINE Console ก่อนปล่อย production
- ยืนยัน production origin เพียงค่าเดียว แล้วใช้ค่านั้นใน Canonical, Open Graph, sitemap และ OAuth callback
- deploy frontend และ service worker รุ่นใหม่พร้อมกัน เพื่อไม่ให้ manifest/locale cache คนละรุ่น
- เปิด `/th`, `/en`, `/my` แบบ hard refresh บน production และตรวจว่าโฮสต์ส่ง `index.html` ให้ client-side routes
- ตรวจ URL เดิม `/shop`, `/product/:id`, `/cart` ว่าส่งต่อไปภาษาไทยและไม่เกิด redirect loop
- ตรวจ API จริงในภาษาอังกฤษและพม่าว่า error code แสดงข้อความแปล ไม่แสดงข้อความไทยจากเซิร์ฟเวอร์
