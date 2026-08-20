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
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + '/';
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
            มีเวอร์ชันใหม่ กรุณาโหลดหน้าเว็บอีกครั้ง
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
