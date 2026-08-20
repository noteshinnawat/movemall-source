import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { stripLocale } from '../i18n/locales';
import './Footer.css';

const SOCIALS = [
  { icon: '📘', label: 'Facebook', href: '#' },
  { icon: '📸', label: 'Instagram', href: '#' },
  { icon: '🐦', label: 'Twitter', href: '#' },
  { icon: '▶️', label: 'YouTube', href: '#' },
];

export function Footer() {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const path = stripLocale(location.pathname);
  const columns = [
    {
      title: t('footer.shoppingTitle'),
      links: [
        { label: t('footer.allProducts'), href: '/shop' },
        { label: t('footer.electronics'), href: '/shop?category=electronics' },
        { label: t('footer.fashion'), href: '/shop?category=fashion' },
        { label: t('footer.beauty'), href: '/shop?category=beauty' },
        { label: t('footer.sale'), href: '/shop?filter=sale' },
      ],
    },
    {
      title: t('footer.accountTitle'),
      links: [
        { label: t('footer.cart'), href: '/cart' },
        { label: t('footer.wishlist'), href: '/wishlist' },
        { label: t('footer.orders'), href: '/orders' },
        { label: t('footer.profile'), href: '/account' },
      ],
    },
    {
      title: t('footer.helpTitle'),
      links: [
        { label: t('footer.helpFaq'), href: '/help' },
        { label: t('footer.howToOrder'), href: '/how-to-order' },
        { label: t('footer.shipping'), href: '/shipping' },
        { label: t('footer.returns'), href: '/returns' },
        { label: t('footer.contact'), href: '/contact' },
      ],
    },
  ];

  // Do not render full footer on full-screen media pages (Video feed, Live stream, Studio)
  if (path === '/video' || path === '/live' || path.startsWith('/video/') || path.startsWith('/creator')) {
    return null;
  }

  return (
    <footer className="footer" aria-label={t('footer.ariaLabel')}>
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <LocalizedLink to="/" className="footer__logo">
              <div className="footer__logo-icon">🛍</div>
              <span className="footer__logo-text">Movemall</span>
            </LocalizedLink>
            <p className="footer__tagline">
              {t('footer.tagline')}
            </p>
            <div className="footer__social">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  className="footer__social-btn"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {columns.map(col => (
            <div key={col.title} className="footer__col">
              <h3 className="footer__col-title">{col.title}</h3>
              <nav className="footer__links" aria-label={col.title}>
                {col.links.map(link => (
                  <LocalizedLink key={link.label} to={link.href} className="footer__link">
                    {link.label}
                  </LocalizedLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copy">
            {t('footer.copyright')}
          </p>
          <div className="footer__badges">
            <span className="footer__badge">🔒 {t('footer.sslSecured')}</span>
            <span className="footer__badge">💳 PromptPay</span>
            <span className="footer__badge">🏦 {t('footer.banking')}</span>
            <span className="footer__badge">📦 {t('footer.freeReturn')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
