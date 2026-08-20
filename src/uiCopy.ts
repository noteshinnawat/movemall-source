// Shared buyer toast copy. Callers pass the active `t` so switching language
// re-renders the callbacks that raise these toasts.

import type { TFunction } from 'i18next';

export const uiCopy = {
  cart: {
    added: (t: TFunction, quantity: number) =>
      t('common:toast.cartAdded', { count: quantity }),
    removed: (t: TFunction) => t('common:toast.cartRemoved'),
    cleared: (t: TFunction) => t('common:toast.cartCleared'),
  },
  wishlist: {
    added: (t: TFunction) => t('common:toast.wishlistAdded'),
    removed: (t: TFunction) => t('common:toast.wishlistRemoved'),
  },
} as const;
