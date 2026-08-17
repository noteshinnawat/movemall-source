// src/components/BackToTopButton.tsx — Floating Back to Top Button

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import './BackToTopButton.css';

export function BackToTopButton() {
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
      aria-label="เลื่อนขึ้นด้านบนสุด"
      title="เลื่อนขึ้นบนสุด"
    >
      <ChevronUp size={20} className="back-to-top-icon" />
      <span className="back-to-top-text">ขึ้นบนสุด</span>
    </button>
  );
}

export default BackToTopButton;
