import { formatCurrency } from '../i18n/formatters.ts';
import type { Locale } from '../i18n/locales.ts';

const DEMO_PRODUCT_OPTION_KEYS = {
  fashion: [
    'product.options.fashion.classicBlack',
    'product.options.fashion.pearlWhite',
    'product.options.fashion.navyBlue',
    'product.options.fashion.beige',
  ],
  electronics: [
    'product.options.electronics.spaceGray',
    'product.options.electronics.silver',
    'product.options.electronics.midnightBlue',
    'product.options.electronics.starlight',
  ],
  beauty: [
    'product.options.beauty.naturalGlow',
    'product.options.beauty.warmPeach',
    'product.options.beauty.softRose',
  ],
  default: [
    'product.options.default.standard',
    'product.options.default.proEdition',
    'product.options.default.classicBlack',
  ],
} as const;

export function getDemoProductOptionKeys(category: string): readonly string[] {
  if (category === 'fashion' || category === 'electronics' || category === 'beauty') {
    return DEMO_PRODUCT_OPTION_KEYS[category];
  }

  return DEMO_PRODUCT_OPTION_KEYS.default;
}

export function getProductPerkInterpolation(threshold: number, locale: Locale) {
  return { amount: formatCurrency(threshold, locale) };
}
