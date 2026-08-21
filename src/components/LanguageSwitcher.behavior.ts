import { replaceLocale, type Locale } from '../i18n/locales.ts';

const OPERATIONAL_PREFIXES = ['/seller', '/admin', '/affiliate', '/creator'] as const;

export function getLanguageSwitchTarget(
  pathname: string,
  search: string,
  hash: string,
  locale: Locale,
) {
  return replaceLocale(`${pathname}${search}${hash}`, locale);
}

export function isLanguageSwitcherExcluded(pathname: string) {
  return pathname === '/video/create'
    || OPERATIONAL_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export type LanguageMenuKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End';

export function nextLanguageOptionIndex(
  currentIndex: number,
  key: LanguageMenuKey,
  optionCount: number,
) {
  if (key === 'Home') return 0;
  if (key === 'End') return optionCount - 1;
  if (key === 'ArrowUp') return (currentIndex - 1 + optionCount) % optionCount;
  return (currentIndex + 1) % optionCount;
}

export function shouldCloseLanguageMenu(isOpen: boolean, key: string) {
  return isOpen && key === 'Escape';
}
