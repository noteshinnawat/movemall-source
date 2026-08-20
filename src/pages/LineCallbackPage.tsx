// src/pages/LineCallbackPage.tsx — LINE Login OAuth Callback Handler

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { getLineCallbackUrl } from '../utils/lineAuth';
import { LocalizedLink, useLocalizedPath } from '../i18n/LocalizedLink';

export function LineCallbackPage() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function processLineCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || t('auth:oauth.callback.cancelled'));
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage(t('auth:oauth.callback.missingCode'));
        return;
      }

      try {
        const redirectUri = getLineCallbackUrl();
        const res = await fetchApi<{
          token: string;
          user: {
            id: string;
            name: string;
            email?: string;
            role?: string;
            avatarUrl?: string;
            coinsBalance?: number;
          };
          message?: string;
        }>('/api/auth/line', {
          method: 'POST',
          body: JSON.stringify({
            code,
            state,
            redirectUri,
          }),
        });

        if (res.token) {
          localStorage.setItem('movemall_jwt_token', res.token);
        }

        const isSuper = res.user?.email && ['note.shinnawat@gmail.com', 'admin@movemall.com'].includes(res.user.email.toLowerCase());

        const finalUser = {
          id: res.user?.id,
          name: res.user?.name || t('auth:oauth.lineMemberFallback'),
          email: res.user?.email,
          avatarUrl: res.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=LINE',
          role: res.user?.role || (isSuper ? 'SUPER_ADMIN' : 'BUYER'),
          coinsBalance: res.user?.coinsBalance ?? 100,
          lineConnected: true,
        };

        localStorage.setItem('movemall_user', JSON.stringify(finalUser));
        window.dispatchEvent(new Event('movemall_auth_change'));

        setStatus('success');

        // Redirect after brief delay
        setTimeout(() => {
          if (finalUser.role === 'SUPER_ADMIN' || finalUser.role === 'ADMIN') {
            navigate('/admin');
          } else {
            const originPath = sessionStorage.getItem('line_oauth_redirect_origin');
            navigate(originPath || localizePath('/account'));
          }
        }, 1200);
      } catch (err: any) {
        console.error('LINE OAuth exchange error:', err);
        setStatus('error');
        setErrorMessage(err?.message || t('auth:oauth.callback.exchangeFailed'));
      }
    }

    processLineCallback();
  }, [searchParams, navigate, localizePath, t]);

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 440, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {status === 'loading' && (
          <div>
            <div style={{ width: 44, height: 44, border: '4px solid #E2E8F0', borderTopColor: '#06C755', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>{t('auth:oauth.callback.loadingTitle')}</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B' }}>{t('auth:oauth.callback.loadingDesc')}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>{t('auth:oauth.callback.successTitle')}</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B' }}>{t('auth:oauth.callback.successDesc')}</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertCircle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>{t('auth:oauth.callback.errorTitle')}</h2>
            <p style={{ fontSize: '0.85rem', color: '#DC2626', background: '#FEF2F2', padding: '0.75rem', borderRadius: 6, marginBottom: '1.5rem', textAlign: 'left' }}>
              {errorMessage}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <LocalizedLink to="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#06C755', color: '#FFF', padding: '0.65rem 1rem', borderRadius: 6, fontWeight: 700, textDecoration: 'none' }}>
                <RefreshCw size={16} /> {t('auth:oauth.callback.retry')}
              </LocalizedLink>
              <LocalizedLink to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748B', padding: '0.5rem', textDecoration: 'none', fontSize: '0.85rem' }}>
                <ArrowLeft size={16} /> {t('auth:oauth.callback.goHome')}
              </LocalizedLink>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
