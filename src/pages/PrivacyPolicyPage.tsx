// src/pages/PrivacyPolicyPage.tsx — Official PDPA Privacy Policy

import { useTranslation } from 'react-i18next';
import { Shield, ArrowLeft } from 'lucide-react';
import { LocalizedLink } from '../i18n/LocalizedLink';

interface PrivacyListItem {
  label?: string;
  text: string;
}

export function PrivacyPolicyPage() {
  const { t } = useTranslation(['legal', 'common']);
  const s1Items = t('legal:privacy.s1.items', { returnObjects: true }) as PrivacyListItem[];
  const s2Items = t('legal:privacy.s2.items', { returnObjects: true }) as string[];
  const s4Items = t('legal:privacy.s4.items', { returnObjects: true }) as string[];

  return (
    <main style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-6))', minHeight: '100vh', background: 'var(--background)', paddingBottom: 'var(--space-16)' }}>
      <div className="container" style={{ maxWidth: 860, margin: '0 auto', padding: '0 var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <LocalizedLink to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> {t('common:actions.goHome')}
          </LocalizedLink>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Shield size={26} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {t('legal:privacy.title')}
            </h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            {t('legal:privacy.effective')}
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('legal:privacy.s1.heading')}
              </h2>
              <p>{t('legal:privacy.s1.intro')}</p>
              <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                {s1Items.map(item => (
                  <li key={item.label}>
                    <strong>{item.label}</strong> {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('legal:privacy.s2.heading')}
              </h2>
              <ul style={{ paddingLeft: 20 }}>
                {s2Items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('legal:privacy.s3.heading')}
              </h2>
              <p>{t('legal:privacy.s3.body')}</p>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('legal:privacy.s4.heading')}
              </h2>
              <p>{t('legal:privacy.s4.intro')}</p>
              <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                {s4Items.map(item => <li key={item}>{item}</li>)}
              </ul>
              <p style={{ marginTop: 8 }}>
                {t('legal:privacy.s4.footerPrefix')} <strong>dpo@movemall.com</strong>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPolicyPage;
