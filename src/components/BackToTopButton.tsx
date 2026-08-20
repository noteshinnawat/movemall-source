// src/components/BackToTopButton.tsx — Floating Back to Top Button

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp } from 'lucide-react';
import './BackToTopButton.css';

export function BackToTopButton() {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className="back-to-top-btn"
      onClick={scrollToTop}
      aria-label={t('accessibility.backToTop')}
      title={t('accessibility.backToTopTitle')}
    >
      <ChevronUp size={20} className="back-to-top-icon" />
      <span className="back-to-top-text">{t('accessibility.backToTopText')}</span>
    </button>
  );
}

export default BackToTopButton;
