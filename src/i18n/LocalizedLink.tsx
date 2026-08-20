/* oxlint-disable react/only-export-components -- This module intentionally exports the link and its path hook. */
import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import i18n from './config';
import {
  isBuyerLegacyPath,
  localeFromPath,
  resolveRootLocale,
  withLocale,
} from './locales';

export function useLocalizedPath() {
  const location = useLocation();
  const locale = localeFromPath(location.pathname)
    ?? resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);

  return useCallback(
    (to: string) => isBuyerLegacyPath(to) ? withLocale(to, locale) : to,
    [locale],
  );
}

export interface LocalizedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
}

export function LocalizedLink({ to, ...props }: LocalizedLinkProps) {
  const localizePath = useLocalizedPath();
  return <Link {...props} to={localizePath(to)} />;
}
