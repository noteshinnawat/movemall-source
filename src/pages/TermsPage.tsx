// src/pages/TermsPage.tsx — Terms of Service & Conditions

import { useTranslation } from 'react-i18next';
import { FileText, ArrowLeft } from 'lucide-react';
import { LocalizedLink } from '../i18n/LocalizedLink';

const SECTIONS = ['s1', 's2', 's3', 's4'] as const;

export function TermsPage() {
  const { t } = useTranslation(['legal', 'common']);

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
            <FileText size={26} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {t('legal:terms.title')}
            </h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            {t('legal:terms.updated')}
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {SECTIONS.map(section => (
              <div key={section}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {t(`legal:terms.${section}.heading`)}
                </h2>
                <p>{t(`legal:terms.${section}.body`)}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

export default TermsPage;
