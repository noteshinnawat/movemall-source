import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

const COLUMNS = [
  {
    title: 'ช้อปปิ้ง',
    links: [
      { label: 'สินค้าทั้งหมด', href: '/shop' },
      { label: 'อิเล็กทรอนิกส์', href: '/shop?category=electronics' },
      { label: 'แฟชั่น', href: '/shop?category=fashion' },
      { label: 'ความงาม', href: '/shop?category=beauty' },
      { label: 'สินค้าลดราคา', href: '/shop?filter=sale' },
    ],
  },
  {
    title: 'บัญชี',
    links: [
      { label: 'ตะกร้าสินค้า', href: '/cart' },
      { label: 'Wishlist', href: '/wishlist' },
      { label: 'ประวัติคำสั่งซื้อ', href: '/orders' },
      { label: 'ข้อมูลส่วนตัว', href: '/account' },
    ],
  },
  {
    title: 'ช่วยเหลือ',
    links: [
      { label: 'ศูนย์ช่วยเหลือ (FAQ)', href: '/help' },
      { label: 'วิธีสั่งซื้อสินค้า', href: '/how-to-order' },
      { label: 'การจัดส่งสินค้า', href: '/shipping' },
      { label: 'นโยบายคืนสินค้า', href: '/returns' },
      { label: 'ติดต่อเรา', href: '/contact' },
    ],
  },
];

const SOCIALS = [
  { icon: '📘', label: 'Facebook', href: '#' },
  { icon: '📸', label: 'Instagram', href: '#' },
  { icon: '🐦', label: 'Twitter', href: '#' },
  { icon: '▶️', label: 'YouTube', href: '#' },
];

export function Footer() {
  const location = useLocation();
  const path = location.pathname;

  // Do not render full footer on full-screen media pages (Video feed, Live stream, Studio)
  if (path === '/video' || path === '/live' || path.startsWith('/video/') || path.startsWith('/creator')) {
    return null;
  }

  return (
    <footer className="footer" aria-label="Footer">
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <div className="footer__logo-icon">🛍</div>
              <span className="footer__logo-text">Movemall</span>
            </Link>
            <p className="footer__tagline">
              แพลตฟอร์มช้อปปิ้งออนไลน์ที่ดีที่สุด สินค้าหลากหลาย ราคาโดน จัดส่งไว ปลอดภัย 100%
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
          {COLUMNS.map(col => (
            <div key={col.title} className="footer__col">
              <h3 className="footer__col-title">{col.title}</h3>
              <nav className="footer__links" aria-label={col.title}>
                {col.links.map(link => (
                  <Link key={link.label} to={link.href} className="footer__link">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © 2026 Movemall. สงวนสิทธิ์ทั้งหมด 🇹🇭
          </p>
          <div className="footer__badges">
            <span className="footer__badge">🔒 SSL Secured</span>
            <span className="footer__badge">💳 PromptPay</span>
            <span className="footer__badge">🏦 Banking</span>
            <span className="footer__badge">📦 Free Return</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
