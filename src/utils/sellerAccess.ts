interface SellerSessionUser {
  role?: unknown;
}

const SELLER_ROLES = new Set(['SELLER', 'CREATOR', 'SUPER_ADMIN', 'ADMIN']);

export function isSellerRole(user: SellerSessionUser | null | undefined): boolean {
  return SELLER_ROLES.has(String(user?.role || '').toUpperCase());
}

export function canAccessSellerHub(
  user: SellerSessionUser | null | undefined,
  token: string | null | undefined,
): boolean {
  return Boolean(user) && Boolean(token?.trim()) && isSellerRole(user);
}
