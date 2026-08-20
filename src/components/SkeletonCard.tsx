// src/components/SkeletonCard.tsx

import { useTranslation } from 'react-i18next';
import './SkeletonCard.css';

export function SkeletonCard() {
  const { t } = useTranslation('common');

  return (
    <div className="skeleton-card" role="status" aria-label={t('accessibility.loadingProducts')}>
      <div className="skeleton-card__image skeleton" aria-hidden="true" />
      <div className="skeleton-card__body" aria-hidden="true">
        <div className="skeleton skeleton-card__line skeleton-card__line--short" />
        <div className="skeleton skeleton-card__line skeleton-card__line--long" />
        <div className="skeleton skeleton-card__line skeleton-card__line--medium" />
        <div className="skeleton skeleton-card__line skeleton-card__line--price" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

export default SkeletonCard;
