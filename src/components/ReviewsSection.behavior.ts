import { formatDate } from '../i18n/formatters.ts';
import type { Locale } from '../i18n/locales.ts';

const LOCALE_TAGS: Record<Locale, string> = {
  th: 'th-TH-u-nu-latn',
  en: 'en-US-u-nu-latn',
  my: 'my-MM-u-nu-latn',
};

export interface ReviewDateMetadata {
  reviewedAt?: string;
  relativeAge?: {
    value: number;
    unit: 'day' | 'week' | 'month';
  };
}

export function createReviewDateMetadata(now = new Date()): Pick<ReviewDateMetadata, 'reviewedAt'> {
  return { reviewedAt: now.toISOString() };
}

function calendarDay(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(value);
}

export function formatReviewDate(
  metadata: ReviewDateMetadata | undefined,
  locale: Locale,
  now = new Date(),
): string {
  if (!metadata) return '';

  if (metadata.relativeAge) {
    return new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: 'auto' }).format(
      -metadata.relativeAge.value,
      metadata.relativeAge.unit,
    );
  }

  if (!metadata.reviewedAt) return '';

  const reviewedAt = new Date(metadata.reviewedAt);
  if (calendarDay(reviewedAt, locale) === calendarDay(now, locale)) {
    return new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: 'auto' }).format(0, 'day');
  }

  return formatDate(reviewedAt, locale);
}
