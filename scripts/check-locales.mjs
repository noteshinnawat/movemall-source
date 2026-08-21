import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const languages = ['th', 'en', 'my'];
const namespaces = ['common', 'navigation', 'auth', 'catalog', 'commerce', 'engagement', 'legal'];

const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flatten(child, path) : [[path, child]];
});

// Interpolation tokens are load-bearing: a placeholder dropped in one language
// makes its value vanish from the UI, which key parity alone would not catch.
const placeholders = value => (typeof value === 'string'
  ? [...value.matchAll(/\{\{([^}]+)\}\}/g)].map(([, token]) => token.trim()).sort()
  : []).join('|');

const errors = [];

for (const namespace of namespaces) {
  const catalogs = Object.fromEntries(await Promise.all(languages.map(async language => {
    try {
      return [language, JSON.parse(await readFile(`public/locales/${language}/${namespace}.json`, 'utf8'))];
    } catch (error) {
      errors.push(`Unable to read ${language}/${namespace}: ${error.message}`);
      return [language, {}];
    }
  })));
  const expectedKeys = new Set(flatten(catalogs.th).map(([key]) => key));

  for (const language of languages) {
    const entries = flatten(catalogs[language]);
    const actualKeys = new Set(entries.map(([key]) => key));
    const missing = [...expectedKeys].filter(key => !actualKeys.has(key));
    const extra = [...actualKeys].filter(key => !expectedKeys.has(key));
    const empty = entries.filter(([, value]) => typeof value === 'string' && value.trim().length === 0).map(([key]) => key);

    const thaiValues = new Map(flatten(catalogs.th));
    const mismatched = entries
      .filter(([key, value]) => actualKeys.has(key) && expectedKeys.has(key)
        && placeholders(value) !== placeholders(thaiValues.get(key)))
      .map(([key]) => key);

    if (missing.length) errors.push(`${language}/${namespace}: missing keys: ${missing.join(', ')}`);
    if (mismatched.length) errors.push(`${language}/${namespace}: placeholder mismatch: ${mismatched.join(', ')}`);
    if (extra.length) errors.push(`${language}/${namespace}: extra keys: ${extra.join(', ')}`);
    if (empty.length) errors.push(`${language}/${namespace}: empty keys: ${empty.join(', ')}`);
  }
}

if (errors.length) {
  console.error('Locale catalog validation failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Locale catalogs are valid.');
}

// Files that were brought into scope for buyer localization (Tasks 4-8, plus
// buyer-facing routing in App.tsx). Anything outside this list — sellers,
// creator studio, affiliate tools, mock data — is intentionally not audited.
export const BUYER_SOURCE_FILES = [
  'src/App.tsx',
  'src/components/BackToTopButton.tsx',
  'src/components/CartItem.tsx',
  'src/components/CookieConsentBanner.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/FilterSidebar.tsx',
  'src/components/FloatingLiveWidget.tsx',
  'src/components/Footer.tsx',
  'src/components/LanguageSwitcher.behavior.ts',
  'src/components/LanguageSwitcher.tsx',
  'src/components/LineConnectModal.tsx',
  'src/components/LiveActivityTicker.tsx',
  'src/components/LiveStreamCard.tsx',
  'src/components/MobileBottomNav.tsx',
  'src/components/Navbar.tsx',
  'src/components/PWAInstallPrompt.tsx',
  'src/components/ProductCard.tsx',
  'src/components/PromptPayModal.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/components/ReportStoreModal.tsx',
  'src/components/ReviewsSection.behavior.ts',
  'src/components/ReviewsSection.tsx',
  'src/components/SkeletonCard.tsx',
  'src/components/Toast.tsx',
  'src/components/TurnstileWidget.tsx',
  'src/components/VideoClipInGridCard.tsx',
  'src/components/VisualSearch.behavior.ts',
  'src/components/VisualSearchModal.tsx',
  'src/components/YellowBasketModal.tsx',
  'src/i18n/config.ts',
  'src/i18n/formatters.ts',
  'src/pages/AccountPage.tsx',
  'src/pages/BrandMallPage.behavior.ts',
  'src/pages/BrandMallPage.tsx',
  'src/pages/CartPage.tsx',
  'src/pages/ChatPage.tsx',
  'src/pages/CheckoutPage.tsx',
  'src/pages/ComparePage.tsx',
  'src/pages/FlashSalePage.tsx',
  'src/pages/GamesPage.tsx',
  'src/pages/HelpCenterPage.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/LineCallbackPage.tsx',
  'src/pages/LiveStreamPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/NotificationsPage.tsx',
  'src/pages/OrderSuccessPage.tsx',
  'src/pages/OrdersPage.tsx',
  'src/pages/PrivacyPolicyPage.tsx',
  'src/pages/ProductDetailPage.behavior.ts',
  'src/pages/ProductDetailPage.tsx',
  'src/pages/RegisterPage.tsx',
  'src/pages/ShopPage.tsx',
  'src/pages/StorePage.tsx',
  'src/pages/StoresDirectoryPage.tsx',
  'src/pages/TermsPage.tsx',
  'src/pages/TrackingPage.tsx',
  'src/pages/VideoFeedPage.tsx',
  'src/pages/VouchersPage.tsx',
  'src/pages/WishlistPage.tsx',
  'src/uiCopy.ts',
  'src/utils/lineAuth.ts',
  'src/utils/turnstile.ts',
];

// Thai script range, excluding the baht sign (฿, U+0E3F) which appears in
// prices in every language and is not translatable UI copy.
const THAI_RE = /[ก-฾เ-๿]/u;
const ALLOW_MARKER = 'i18n-allow-user-content';
const VISIBLE_JSX_ATTRS = new Set(['placeholder', 'aria-label', 'title', 'alt']);
const ALERT_CALLEES = new Set(['alert', 'confirm']);
const TOAST_CALL_RE = /toast/i;

function scriptKindFor(fileName) {
  return fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function isAllowedByComment(sourceFile, pos) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(pos);
  const lines = sourceFile.text.split('\n');
  for (let ln = Math.max(0, line - 1); ln <= line; ln += 1) {
    if (lines[ln]?.includes(ALLOW_MARKER)) return true;
  }
  return false;
}

function calleeName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return '';
}

function calleeText(expression) {
  if (ts.isPropertyAccessExpression(expression)) return `${calleeText(expression.expression)}.${expression.name.text}`;
  if (ts.isIdentifier(expression)) return expression.text;
  return '';
}

function auditFile(relativePath, text) {
  const violations = [];
  const sourceFile = ts.createSourceFile(relativePath, text, ts.ScriptTarget.Latest, true, scriptKindFor(relativePath));

  const report = (node, reason) => {
    const pos = node.getStart(sourceFile);
    if (isAllowedByComment(sourceFile, pos)) return;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
    violations.push(`${relativePath}:${line + 1}:${character + 1}: ${reason}: ${node.getText(sourceFile).trim().slice(0, 80)}`);
  };

  const visit = node => {
    if (ts.isJsxText(node)) {
      if (THAI_RE.test(node.text)) report(node, 'hardcoded Thai text in JSX');
    } else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && VISIBLE_JSX_ATTRS.has(node.name.text)) {
      const value = node.initializer && ts.isStringLiteral(node.initializer)
        ? node.initializer
        : (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression
          && ts.isStringLiteral(node.initializer.expression) ? node.initializer.expression : null);
      if (value && THAI_RE.test(value.text)) report(value, `hardcoded Thai text in "${node.name.text}" attribute`);
    } else if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);
      const isAlert = ALERT_CALLEES.has(name);
      const isToast = TOAST_CALL_RE.test(calleeText(node.expression));
      if ((isAlert || isToast) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && THAI_RE.test(node.arguments[0].text)) {
        report(node.arguments[0], `hardcoded Thai text in ${isAlert ? 'alert/confirm' : 'toast'} call`);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}

export async function auditBuyerSource() {
  const violations = [];
  for (const relativePath of BUYER_SOURCE_FILES) {
    const text = await readFile(relativePath, 'utf8');
    violations.push(...auditFile(relativePath, text));
  }
  return violations;
}
