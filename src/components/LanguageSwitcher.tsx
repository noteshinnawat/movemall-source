import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from '../i18n/config';
import {
  localeFromPath,
  resolveRootLocale,
  type Locale,
} from '../i18n/locales';
import {
  getLanguageSwitchTarget,
  isLanguageSwitcherExcluded,
  nextLanguageOptionIndex,
  type LanguageMenuKey,
} from './LanguageSwitcher.behavior';
import './LanguageSwitcher.css';

const OPTIONS = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
  { code: 'my', label: 'မြန်မာ' },
] as const;

export function LanguageSwitcher() {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const navigate = useNavigate();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const currentLocale = localeFromPath(location.pathname)
    ?? resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const currentOptionIndex = OPTIONS.findIndex(option => option.code === currentLocale);
  const isExcluded = isLanguageSwitcherExcluded(location.pathname);

  useEffect(() => {
    if (!isOpen || isExcluded) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointer);
    const frame = requestAnimationFrame(() => {
      optionRefs.current[currentOptionIndex]?.focus();
    });

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      cancelAnimationFrame(frame);
    };
  }, [currentOptionIndex, isExcluded, isOpen]);

  if (isExcluded) return null;

  function closeAndRestoreFocus() {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function chooseLanguage(locale: Locale) {
    const next = getLanguageSwitchTarget(
      location.pathname,
      location.search,
      location.hash,
      locale,
    );
    setIsOpen(false);
    void i18n.changeLanguage(locale);
    navigate(next);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = nextLanguageOptionIndex(
      index,
      event.key as LanguageMenuKey,
      OPTIONS.length,
    );
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="language-switcher" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="language-switcher__trigger"
        aria-label={t('language.select')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <Globe2 size={14} aria-hidden="true" />
        <span>{OPTIONS[currentOptionIndex]?.label ?? OPTIONS[0].label}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`language-switcher__chevron${isOpen ? ' language-switcher__chevron--open' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="language-switcher__menu"
          role="menu"
          aria-label={t('language.menu')}
        >
          {OPTIONS.map((option, index) => {
            const isCurrent = option.code === currentLocale;
            return (
              <button
                key={option.code}
                ref={element => { optionRefs.current[index] = element; }}
                type="button"
                className={`language-switcher__option${isCurrent ? ' language-switcher__option--current' : ''}`}
                role="menuitemradio"
                aria-checked={isCurrent}
                aria-current={isCurrent ? 'true' : undefined}
                tabIndex={isCurrent ? 0 : -1}
                onClick={() => chooseLanguage(option.code)}
                onKeyDown={event => handleOptionKeyDown(event, index)}
              >
                <span>{option.label}</span>
                {isCurrent && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
