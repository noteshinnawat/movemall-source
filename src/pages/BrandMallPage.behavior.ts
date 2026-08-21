import { formatCurrency, formatNumber } from '../i18n/formatters.ts';
import type { Locale } from '../i18n/locales.ts';

export interface MallVoucherNumericValues {
  discountPercent?: number;
  discountAmount?: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  maximumCoins?: number;
  expiryHours?: number;
  minimumDeliveryDays?: number;
  maximumDeliveryDays?: number;
}

export function getMallVoucherInterpolation(values: MallVoucherNumericValues, locale: Locale) {
  return {
    ...(values.discountPercent === undefined ? {} : { discount: formatNumber(values.discountPercent, locale) }),
    ...(values.discountAmount === undefined ? {} : { amount: formatCurrency(values.discountAmount, locale) }),
    ...(values.minimumSpend === undefined ? {} : { minimum: formatCurrency(values.minimumSpend, locale) }),
    ...(values.maximumDiscount === undefined ? {} : { maximum: formatCurrency(values.maximumDiscount, locale) }),
    ...(values.maximumCoins === undefined ? {} : { coins: formatNumber(values.maximumCoins, locale) }),
    ...(values.expiryHours === undefined ? {} : { hours: formatNumber(values.expiryHours, locale) }),
    ...(values.minimumDeliveryDays === undefined ? {} : { minimumDays: formatNumber(values.minimumDeliveryDays, locale) }),
    ...(values.maximumDeliveryDays === undefined ? {} : { maximumDays: formatNumber(values.maximumDeliveryDays, locale) }),
  };
}
