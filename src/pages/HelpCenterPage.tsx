// src/pages/HelpCenterPage.tsx — Help Center, How to Order, Shipping, Returns & Contact Us

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  ShoppingBag,
  Truck,
  RotateCcw,
  Mail,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { LocalizedLink } from '../i18n/LocalizedLink';
import { formatCurrency } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './HelpCenterPage.css';

interface HelpCenterPageProps {
  initialTab?: 'help' | 'how-to-order' | 'shipping' | 'returns' | 'contact';
}

interface FaqItem {
  q: string;
  a: string;
}

const FREE_SHIPPING_THRESHOLD = 299;

// Canonical (locale-independent) contact-subject identifiers; only the
// displayed label is translated.
const CONTACT_SUBJECTS = ['order', 'tracking', 'return', 'seller', 'other'] as const;

export function HelpCenterPage({ initialTab = 'help' }: HelpCenterPageProps) {
  const { t, i18n } = useTranslation(['legal', 'common']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const location = useLocation();

  // Determine active tab from URL path
  const getTabFromPath = () => {
    if (location.pathname.includes('how-to-order')) return 'how-to-order';
    if (location.pathname.includes('shipping')) return 'shipping';
    if (location.pathname.includes('returns')) return 'returns';
    if (location.pathname.includes('contact')) return 'contact';
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState<'help' | 'how-to-order' | 'shipping' | 'returns' | 'contact'>(getTabFromPath());
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState<(typeof CONTACT_SUBJECTS)[number]>('order');
  const [contactMessage, setContactMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  function handleSendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setIsSent(true);
  }

  const faqs = t('legal:help.faq.items', { returnObjects: true }) as FaqItem[];

  return (
    <main className="help-page">
      {/* Hero */}
      <section className="help-hero">
        <div className="container">
          <h1 className="help-hero__title">{t('legal:help.heroTitle')}</h1>
          <p className="help-hero__subtitle">
            {t('legal:help.heroSubtitle')}
          </p>

          <nav className="help-nav" aria-label={t('legal:help.navAria')}>
            <LocalizedLink
              to="/help"
              className={`help-nav__item${activeTab === 'help' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('help')}
            >
              <HelpCircle size={15} />
              {t('legal:help.navFaq')}
            </LocalizedLink>
            <LocalizedLink
              to="/how-to-order"
              className={`help-nav__item${activeTab === 'how-to-order' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('how-to-order')}
            >
              <ShoppingBag size={15} />
              {t('legal:help.navHowToOrder')}
            </LocalizedLink>
            <LocalizedLink
              to="/shipping"
              className={`help-nav__item${activeTab === 'shipping' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              <Truck size={15} />
              {t('legal:help.navShipping')}
            </LocalizedLink>
            <LocalizedLink
              to="/returns"
              className={`help-nav__item${activeTab === 'returns' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              <RotateCcw size={15} />
              {t('legal:help.navReturns')}
            </LocalizedLink>
            <LocalizedLink
              to="/contact"
              className={`help-nav__item${activeTab === 'contact' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <Mail size={15} />
              {t('legal:help.navContact')}
            </LocalizedLink>
          </nav>
        </div>
      </section>

      <div className="container help-content">
        {/* ── FAQ TAB ── */}
        {activeTab === 'help' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <HelpCircle size={18} />
              {t('legal:help.faq.title')}
            </h2>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={faq.q} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === idx && <div className="faq-answer">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HOW TO ORDER TAB ── */}
        {activeTab === 'how-to-order' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <ShoppingBag size={18} />
              {t('legal:help.order.title')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {t('legal:help.order.subtitle')}
            </p>

            <div className="help-steps">
              <div className="help-step-box">
                <div className="help-step-num">1</div>
                <h3 className="help-step-title">{t('legal:help.order.step1Title')}</h3>
                <p className="help-step-desc">
                  {t('legal:help.order.step1Desc')}
                </p>
              </div>

              <div className="help-step-box">
                <div className="help-step-num">2</div>
                <h3 className="help-step-title">{t('legal:help.order.step2Title')}</h3>
                <p className="help-step-desc">
                  {t('legal:help.order.step2Desc')}
                </p>
              </div>

              <div className="help-step-box">
                <div className="help-step-num">3</div>
                <h3 className="help-step-title">{t('legal:help.order.step3Title')}</h3>
                <p className="help-step-desc">
                  {t('legal:help.order.step3Desc')}
                </p>
              </div>

              <div className="help-step-box">
                <div className="help-step-num">4</div>
                <h3 className="help-step-title">{t('legal:help.order.step4Title')}</h3>
                <p className="help-step-desc">
                  {t('legal:help.order.step4Desc')}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <LocalizedLink
                to="/shop"
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {t('legal:help.order.startShopping')}
              </LocalizedLink>
            </div>
          </div>
        )}

        {/* ── SHIPPING TAB ── */}
        {activeTab === 'shipping' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <Truck size={18} />
              {t('legal:help.shipping.title')}
            </h2>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                {t('legal:help.shipping.freeTitle')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t('legal:help.shipping.freeBody', {
                  amount: formatCurrency(FREE_SHIPPING_THRESHOLD, locale),
                })}
              </p>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              {t('legal:help.shipping.carriersTitle')}
            </h3>
            <div className="shipping-carriers">
              <div className="carrier-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
                <div className="carrier-card__name">Flash Express</div>
                <div className="carrier-card__time">{t('legal:help.shipping.flashTime')}</div>
              </div>

              <div className="carrier-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>🟧</div>
                <div className="carrier-card__name">Kerry Express</div>
                <div className="carrier-card__time">{t('legal:help.shipping.kerryTime')}</div>
              </div>

              <div className="carrier-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>📮</div>
                <div className="carrier-card__name">{t('legal:help.shipping.thaiPostName')}</div>
                <div className="carrier-card__time">{t('legal:help.shipping.thaiPostTime')}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── RETURNS TAB ── */}
        {activeTab === 'returns' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <RotateCcw size={18} />
              {t('legal:help.returns.title')}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--success-subtle)', border: '1px solid hsla(142, 71%, 45%, 0.3)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <ShieldCheck size={28} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 14, color: 'var(--success)' }}>{t('legal:help.returns.guaranteeTitle')}</strong>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {t('legal:help.returns.guaranteeBody')}
                </p>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              {t('legal:help.returns.stepsTitle')}
            </h3>
            <div className="help-steps">
              <div className="help-step-box">
                <div className="help-step-num">1</div>
                <h4 className="help-step-title">{t('legal:help.returns.step1Title')}</h4>
                <p className="help-step-desc">{t('legal:help.returns.step1Desc')}</p>
              </div>
              <div className="help-step-box">
                <div className="help-step-num">2</div>
                <h4 className="help-step-title">{t('legal:help.returns.step2Title')}</h4>
                <p className="help-step-desc">{t('legal:help.returns.step2Desc')}</p>
              </div>
              <div className="help-step-box">
                <div className="help-step-num">3</div>
                <h4 className="help-step-title">{t('legal:help.returns.step3Title')}</h4>
                <p className="help-step-desc">{t('legal:help.returns.step3Desc')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTACT US TAB ── */}
        {activeTab === 'contact' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <Mail size={18} />
              {t('legal:help.contact.title')}
            </h2>

            <div className="contact-grid">
              <div className="contact-info-list">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t('legal:help.contact.intro')}
                </p>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><Phone size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>{t('legal:help.contact.callCenterTitle')}</h3>
                    <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>02-123-4567</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('legal:help.contact.callCenterHours')}</span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><Mail size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>{t('legal:help.contact.emailTitle')}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>support@movemall.local</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('legal:help.contact.emailHours')}</span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><MessageCircle size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>{t('legal:help.contact.lineTitle')}</h3>
                    <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>@MovemallOfficial</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('legal:help.contact.lineHours')}</span>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                {isSent ? (
                  <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--success)', padding: 'var(--space-6)', textAlign: 'center' }}>
                    <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {t('legal:help.contact.sentTitle')}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      {t('legal:help.contact.sentBody', { email: contactEmail })}
                    </p>
                    <button
                      className="contact-form__btn"
                      onClick={() => {
                        setIsSent(false);
                        setContactName('');
                        setContactEmail('');
                        setContactMessage('');
                      }}
                    >
                      {t('legal:help.contact.sendAnother')}
                    </button>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSendContact}>
                    <input
                      type="text"
                      className="contact-form__input"
                      placeholder={t('legal:help.contact.namePlaceholder')}
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="contact-form__input"
                      placeholder={t('legal:help.contact.emailPlaceholder')}
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                    />
                    <select
                      className="contact-form__input"
                      value={contactSubject}
                      onChange={e => setContactSubject(e.target.value as typeof contactSubject)}
                    >
                      {CONTACT_SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>
                          {t(`legal:help.contact.subjects.${subject}`)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="contact-form__textarea"
                      placeholder={t('legal:help.contact.messagePlaceholder')}
                      required
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                    />
                    <button type="submit" className="contact-form__btn">
                      {t('legal:help.contact.send')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default HelpCenterPage;
