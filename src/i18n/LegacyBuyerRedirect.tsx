import { Navigate, useLocation } from 'react-router-dom';
import { LOCALE_STORAGE_KEY, legacyRedirectTarget } from './locales';

export function LegacyBuyerRedirect() {
  const location = useLocation();
  const target = legacyRedirectTarget(
    `${location.pathname}${location.search}${location.hash}`,
    localStorage.getItem(LOCALE_STORAGE_KEY),
  );

  return target ? <Navigate to={target} replace /> : null;
}
