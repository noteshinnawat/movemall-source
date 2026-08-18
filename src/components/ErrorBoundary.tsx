import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Movemall App Error Caught:', error, errorInfo);

    // If it's a chunk loading error caused by a new deployment on Cloudflare Pages
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      error.message?.includes('MIME type of "text/html"');

    if (isChunkError) {
      const retryKey = 'mm_chunk_reload_' + window.location.pathname;
      if (!sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, 'true');
        console.warn('🔄 Stale chunk detected, refreshing to latest deployment...');
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  private handleGoHome = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          textAlign: 'center',
          background: 'var(--bg-main, #ffffff)',
          color: 'var(--text-primary, #111827)',
          fontFamily: 'inherit',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            marginBottom: 16,
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' }}>
            มีการอัปเดตเวอร์ชันใหม่ หรือพบข้อผิดพลาดชั่วคราว
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted, #6B7280)', maxWidth: 460, margin: '0 0 24px 0', lineHeight: 1.6 }}>
            ระบบตรวจพบการอัปเดตไฟล์เวอร์ชันล่าสุด กรุณากดปุ่มโหลดหน้าเว็บใหม่เพื่อใช้งานต่อได้อย่างราบรื่น
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 22px',
                borderRadius: '6px',
                background: 'var(--primary, #2563EB)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              }}
            >
              🔄 โหลดหน้าเว็บใหม่ (Refresh)
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              🏠 กลับหน้าแรก
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
